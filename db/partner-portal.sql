-- ---------------------------------------------------------------------------
-- NQL Properties — the agency portal, part 1: the database
--
-- Agencies get their own logins. They see a board of anonymised leads, ask for
-- an introduction to the ones they want, and see contact details only for the
-- leads where the buyer has agreed to that introduction.
--
-- Everything that matters is enforced here, not in the interface. An agency
-- account is an outsider authenticating into the database where every lead
-- lives, so row level security is the only thing between them and the
-- pipeline. Hiding a screen is not access control.
--
-- WHAT THIS REPLACES
--
-- Every existing policy reads "to authenticated using (true)": any signed-in
-- account can read everything. That was fine when the only accounts were four
-- people who share an office. It is not fine now. This file REPLACES those
-- policies rather than adding to them, because Postgres combines policies with
-- OR and one surviving "using (true)" would undo the whole file.
--
-- Run the whole thing in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";


-- ===========================================================================
-- 1. WHO IS WHO
--
-- Two kinds of account, and an account is one or the other by being named on
-- a list. Nobody is staff by default: an account that appears on neither list
-- sees nothing at all. That way a stray signup starts with no access rather
-- than all of it.
-- ===========================================================================

create table if not exists nql_staff (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

comment on table nql_staff is
  'Accounts belonging to NQL. Membership here, not the absence of anything else, is what makes someone staff.';

create table if not exists partner_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  name       text,
  status     text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create index if not exists partner_users_partner_idx on partner_users (partner_id);

comment on table partner_users is
  'Accounts belonging to an agency. One agency each; paused keeps the account but closes the door.';


-- Everyone who exists right now is staff: the only accounts today are the NQL
-- team. Agency accounts are created after this file runs, so they never fall
-- into this net.
insert into nql_staff (user_id)
select id from auth.users
where id not in (select user_id from partner_users)
on conflict (user_id) do nothing;


-- A locked-out CRM is worse than an open one, and flipping the policies below
-- with an empty staff list would lock out everybody. Stop here instead.
do $$
begin
  if (select count(*) from nql_staff) = 0 then
    raise exception
      'nql_staff is empty. Flipping the policies now would lock every account out of the CRM. Add your team first.';
  end if;
end $$;


-- ===========================================================================
-- 2. THE TESTS EVERY POLICY BELOW LEANS ON
--
-- security definer so they can read the two tables above without triggering
-- those tables' own policies, which would recurse.
-- ===========================================================================

create or replace function public.is_nql_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from nql_staff where user_id = auth.uid());
$$;

create or replace function public.is_partner_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from partner_users
    where user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.my_partner_id()
returns uuid language sql stable security definer set search_path = public as $$
  select partner_id from partner_users
   where user_id = auth.uid() and status = 'active';
$$;

grant execute on function public.is_nql_staff()    to authenticated;
grant execute on function public.is_partner_user() to authenticated;
grant execute on function public.my_partner_id()   to authenticated;


-- ===========================================================================
-- 3. WHAT A LEAD NEEDS FOR ANY OF THIS TO WORK
-- ===========================================================================

-- Where the buyer is looking. Also answers the older question about recording
-- which Mediterranean country a lead wants: an agency board without a place
-- filter is unusable, and an Umbrian agency has no business reading Cyprus
-- enquiries.
-- These two come from db/lead-numbers.sql and db/deal-value.sql. Repeated
-- here because the board view reads both, and a view cannot be created over a
-- column that is not there. Harmless if those scripts have already run.
alter table leads add column if not exists lead_no text;
alter table leads add column if not exists deal_value numeric;

alter table leads add column if not exists country text;

-- How much of what the buyer asked for we can show them. Also defined in
-- db/lead-match.sql; repeated so that file and this one describe the same
-- board and either can be run second.
alter table leads add column if not exists match_score smallint
  check (match_score between 0 and 100);
alter table leads add column if not exists match_note text;

-- The consent trail. Nothing is revealed to an agency without a 'yes' here,
-- and the row records which agency was named when the buyer agreed, so a
-- later "yes" cannot be reused for a different one.
alter table leads add column if not exists intro_consent text
  check (intro_consent in ('asked', 'yes', 'no'));
alter table leads add column if not exists intro_consent_at timestamptz;
alter table leads add column if not exists intro_partner_id uuid
  references partners(id) on delete set null;

comment on column leads.intro_consent is
  'Whether the buyer agreed to be introduced to intro_partner_id. Null means never asked.';


-- ===========================================================================
-- 4. ASKING FOR AN INTRODUCTION
--
-- Created before the board view below, which counts these rows.
-- ===========================================================================

create table if not exists partner_interest (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id)    on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),

  -- asked      the agency wants it, NQL has not looked yet
  -- declined   NQL said no, before the buyer was ever troubled
  -- pending    the buyer has been asked and has not answered
  -- granted    the buyer said yes; contact details are open to this agency
  -- refused    the buyer said no
  status      text not null default 'asked'
              check (status in ('asked', 'declined', 'pending', 'granted', 'refused')),
  note        text,
  decided_at  timestamptz,
  decided_by  uuid references auth.users(id) on delete set null,

  -- One ask per agency per lead. A second click changes nothing.
  unique (lead_id, partner_id)
);

create index if not exists partner_interest_lead_idx    on partner_interest (lead_id);
create index if not exists partner_interest_partner_idx on partner_interest (partner_id);
create index if not exists partner_interest_status_idx  on partner_interest (status);

-- ===========================================================================
-- 5. WHAT AN AGENCY MAY SEE BEFORE CONSENT
--
-- No name, no email, no phone, no message, no page they came from, no raw
-- payload. The budget is reduced to a band, which is what makes it safe: a
-- band is computed from a number, so nothing a person typed can travel
-- through it.
-- ===========================================================================

create or replace function public.budget_band(budget_text text, value numeric)
returns text language plpgsql immutable as $$
declare
  n numeric;
  digits text;
begin
  n := value;

  -- Fall back to what the buyer typed, but only ever the number in it.
  -- "around 1.5M, my wife's family is from Todi" yields 1500000 and nothing
  -- else: the sanitising is the point, not a side effect.
  if n is null and budget_text is not null then
    digits := substring(replace(budget_text, ',', '.') from '[0-9]+\.?[0-9]*');
    if digits is not null and digits <> '' then
      n := digits::numeric;
      if lower(budget_text) like '%m%' and n < 100 then
        n := n * 1000000;
      elsif n < 10000 then
        n := n * 1000;
      end if;
    end if;
  end if;

  if n is null or n <= 0 then return 'Not stated';
  elsif n <   250000 then return 'Under 250k';
  elsif n <   500000 then return '250k to 500k';
  elsif n <  1000000 then return '500k to 1M';
  elsif n <  2000000 then return '1M to 2M';
  else                    return 'Over 2M';
  end if;
end;
$$;

create or replace function public.match_band(score smallint)
returns text language sql immutable as $$
  select case
    when score is null then null
    when score >= 80   then 'hot'
    when score >= 50   then 'warm'
    when score >= 1    then 'limited'
    else null
  end;
$$;

grant execute on function public.match_band(smallint) to authenticated;


-- Dropped and recreated rather than replaced. "create or replace view" may
-- only append columns to the end of the list, so re-running this file after
-- the board has gained a column fails with "cannot change name of view
-- column". Nothing depends on it; the grant is put back below.
drop view if exists partner_board;

create view partner_board
with (security_barrier = true) as
  select
    l.id,
    l.lead_no,
    l.created_at,
    l.stage,
    l.country,
    l.property_name,
    l.project_interest,
    public.budget_band(l.budget, l.deal_value) as budget_band,
    public.match_band(l.match_score)           as match_band,
    -- Whether this one is already spoken for, so nobody asks for a lead that
    -- has gone. The agency holding it is deliberately not named.
    (l.intro_consent = 'yes')                  as introduced,
    -- Has this agency already asked about it
    exists (
      select 1 from partner_interest pi
       where pi.lead_id = l.id and pi.partner_id = public.my_partner_id()
    )                                          as asked
  from leads l
  where public.is_partner_user()
    and l.stage not in ('won', 'lost')
    and coalesce(l.intro_consent, '') <> 'yes';

comment on view partner_board is
  'The anonymised board an agency sees. Returns nothing at all to an account that is not an active agency user.';





-- ===========================================================================
-- 6. WHAT AN AGENCY MAY SEE AFTER CONSENT
--
-- Two gates, both required: the lead is linked to this agency in
-- lead_partners, and the buyer said yes to this agency by name.
-- ===========================================================================

drop view if exists partner_leads;

create view partner_leads
with (security_barrier = true) as
  select
    l.id, l.lead_no, l.created_at, l.stage, l.country,
    l.first_name, l.last_name, l.email, l.phone,
    l.budget, l.message, l.property_name, l.project_interest,
    l.intro_consent_at
  from leads l
  join lead_partners lp on lp.lead_id = l.id
  where public.is_partner_user()
    and lp.partner_id = public.my_partner_id()
    and l.intro_consent = 'yes'
    and l.intro_partner_id = public.my_partner_id();

comment on view partner_leads is
  'Full details, and only for leads this agency was named on and the buyer agreed to.';

grant select on partner_board to authenticated;
grant select on partner_leads to authenticated;


-- ===========================================================================
-- 7. THE POLICIES
--
-- Every "using (true)" below is being replaced, not joined. Postgres ORs
-- policies together, so one left standing would undo everything here.
-- ===========================================================================

alter table nql_staff        enable row level security;
alter table partner_users    enable row level security;
alter table partner_interest enable row level security;

-- Who is on the lists. Staff read both; an agency user may read only their
-- own row, so they can tell which agency they belong to.
drop policy if exists "staff read nql_staff"  on nql_staff;
drop policy if exists "staff write nql_staff" on nql_staff;
create policy "staff read nql_staff"
  on nql_staff for select to authenticated using (public.is_nql_staff());
create policy "staff write nql_staff"
  on nql_staff for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

drop policy if exists "read partner users"  on partner_users;
drop policy if exists "staff write partner users" on partner_users;
create policy "read partner users"
  on partner_users for select to authenticated
  using (public.is_nql_staff() or user_id = auth.uid());
create policy "staff write partner users"
  on partner_users for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

-- Leads. Staff only, through the tables. Agencies reach leads through the two
-- views above and nowhere else.
drop policy if exists "staff read leads"   on leads;
drop policy if exists "staff write leads"  on leads;
drop policy if exists "staff delete leads" on leads;
drop policy if exists "staff insert leads" on leads;
create policy "staff read leads"
  on leads for select to authenticated using (public.is_nql_staff());
create policy "staff write leads"
  on leads for update to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());
create policy "staff delete leads"
  on leads for delete to authenticated using (public.is_nql_staff());
create policy "staff insert leads"
  on leads for insert to authenticated with check (public.is_nql_staff());

-- Notes, reminders, tasks, subscribers, presence: staff, and nobody else.
drop policy if exists "staff read notes"  on lead_notes;
drop policy if exists "staff add notes"   on lead_notes;
drop policy if exists "staff write notes" on lead_notes;
create policy "staff read notes"
  on lead_notes for select to authenticated using (public.is_nql_staff());
create policy "staff write notes"
  on lead_notes for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

drop policy if exists "staff read reminders"  on lead_reminders;
drop policy if exists "staff write reminders" on lead_reminders;
create policy "staff read reminders"
  on lead_reminders for select to authenticated using (public.is_nql_staff());
create policy "staff write reminders"
  on lead_reminders for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

-- Guarded from here down: these come from scripts that may not have been run
-- in this project. A policy on a table that is not there aborts the whole
-- file, and losing the lead policies above to a missing newsletter table
-- would be a poor trade.
do $$
begin
  if to_regclass('public.subscribers') is not null then
    execute 'drop policy if exists "staff read subscribers"   on subscribers';
    execute 'drop policy if exists "staff update subscribers" on subscribers';
    execute 'drop policy if exists "staff delete subscribers" on subscribers';
    execute 'create policy "staff read subscribers" on subscribers for select to authenticated using (public.is_nql_staff())';
    execute 'create policy "staff update subscribers" on subscribers for update to authenticated using (public.is_nql_staff()) with check (public.is_nql_staff())';
    execute 'create policy "staff delete subscribers" on subscribers for delete to authenticated using (public.is_nql_staff())';
  end if;

  if to_regclass('public.presence') is not null then
    execute 'drop policy if exists "staff read presence" on presence';
    execute 'create policy "staff read presence" on presence for select to authenticated using (public.is_nql_staff())';
  end if;
end $$;

-- Agencies and the people at them. An agency user may read their own agency's
-- row, which is what the portal puts in its header. Nothing else.
drop policy if exists "staff manage partners" on partners;
drop policy if exists "read partners" on partners;
create policy "read partners"
  on partners for select to authenticated
  using (public.is_nql_staff() or id = public.my_partner_id());
create policy "staff manage partners"
  on partners for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

drop policy if exists "staff manage partner contacts" on partner_contacts;
create policy "staff manage partner contacts"
  on partner_contacts for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

drop policy if exists "staff manage lead partners" on lead_partners;
create policy "staff manage lead partners"
  on lead_partners for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

do $$
begin
  if to_regclass('public.partner_staff') is not null then
    execute 'drop policy if exists "read partner staff"  on partner_staff';
    execute 'drop policy if exists "write partner staff" on partner_staff';
    execute 'create policy "read partner staff" on partner_staff for select to authenticated using (public.is_nql_staff())';
    execute 'create policy "write partner staff" on partner_staff for all to authenticated using (public.is_nql_staff()) with check (public.is_nql_staff())';
  end if;
end $$;

-- Expressions of interest. An agency writes its own and reads its own; staff
-- see and decide all of them. An agency cannot set its own status, which is
-- the point: granting itself access would be a click away otherwise.
drop policy if exists "read interest"    on partner_interest;
drop policy if exists "agency ask"       on partner_interest;
drop policy if exists "staff decide"     on partner_interest;
create policy "read interest"
  on partner_interest for select to authenticated
  using (public.is_nql_staff() or partner_id = public.my_partner_id());
create policy "agency ask"
  on partner_interest for insert to authenticated
  with check (
    partner_id = public.my_partner_id()
    and user_id = auth.uid()
    and status = 'asked'
  );
create policy "staff decide"
  on partner_interest for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

grant select, insert on partner_interest to authenticated;
grant update, delete on partner_interest to authenticated;
grant select, insert, update, delete on nql_staff     to authenticated;
grant select, insert, update, delete on partner_users to authenticated;


-- Tasks exist only if db/tasks.sql has been run.
do $$
begin
  if to_regclass('public.tasks') is not null then
    execute 'drop policy if exists "staff read tasks" on tasks';
    execute 'drop policy if exists "staff write tasks" on tasks';
    execute 'create policy "staff read tasks" on tasks for select to authenticated using (public.is_nql_staff())';
    execute 'create policy "staff write tasks" on tasks for all to authenticated using (public.is_nql_staff()) with check (public.is_nql_staff())';
  end if;
end $$;


-- ===========================================================================
-- 8. THE STAFF LIST ITSELF
--
-- The CRM reads this to put names on leads. An agency user has no business
-- with the NQL team's addresses, so the view returns nothing to them.
-- ===========================================================================

create or replace view staff as
  select id,
         email,
         coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name
  from auth.users
  where public.is_nql_staff();

grant select on staff to authenticated;


-- ===========================================================================
-- 9. WHAT HAPPENED
-- ===========================================================================

select 'nql staff'     as list, count(*) from nql_staff
union all
select 'agency logins' as list, count(*) from partner_users;

-- Every remaining policy that lets any signed-in account through. This should
-- come back with lead_stages only: the six stage names are not a secret and
-- the portal needs to read them.
select tablename, policyname, qual
  from pg_policies
 where schemaname = 'public'
   and qual = 'true'
 order by tablename;
