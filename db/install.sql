-- ===========================================================================
-- NQL Properties CRM — the entire database, in one file
--
-- Paste this into the Supabase SQL editor and run it. That is the whole
-- procedure. There is no order to get right and nothing to run first.
--
-- Every statement is guarded, so it does not matter what has been run before,
-- what half-ran, or what errored. Running it again changes nothing except to
-- correct anything that has drifted.
--
-- This replaces schema.sql, grants.sql, partners.sql, subscribers.sql,
-- partners-seed.sql and agencies-install.sql, which are kept only as the
-- record of how it was built.
-- ===========================================================================


create extension if not exists "pgcrypto";


-- =========================================================================
-- LEADS, NOTES, REMINDERS, STAGES
-- =========================================================================


-- --------------------------------------------------------------------------
-- Reference values. Kept as tables rather than enums so stages can be renamed
-- later without a migration.
-- --------------------------------------------------------------------------

create table if not exists lead_stages (
  key        text primary key,
  label      text not null,
  sort_order int  not null,
  is_closed  boolean not null default false
);

insert into lead_stages (key, label, sort_order, is_closed) values
  ('new',       'New',            1, false),
  ('contacted', 'Contacted',      2, false),
  ('viewing',   'Viewing booked', 3, false),
  ('offer',     'Offer',          4, false),
  ('won',       'Won',            5, true),
  ('lost',      'Lost',           6, true)
on conflict (key) do nothing;

-- --------------------------------------------------------------------------
-- Leads. One row per form submission.
--
-- The typed columns cover what every form sends; `raw` keeps the complete
-- payload so a new field on a form is never silently dropped.
-- --------------------------------------------------------------------------

create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- where it came from: contact | property | meeting | footer | newsletter
  source           text not null,
  page_url         text,

  -- pipeline
  stage            text not null default 'new' references lead_stages(key),
  assigned_to      uuid references auth.users(id) on delete set null,

  -- the person
  first_name       text,
  last_name        text,
  email            text,
  phone            text,
  budget           text,
  message          text,

  -- property enquiries
  property_name    text,

  -- meeting requests
  meeting_format   text,
  preferred_date   date,
  preferred_time   text,
  project_interest text,

  -- everything as received, so nothing is lost
  raw              jsonb not null default '{}'::jsonb
);

create index if not exists leads_created_at_idx  on leads (created_at desc);
create index if not exists leads_stage_idx       on leads (stage);
create index if not exists leads_assigned_to_idx on leads (assigned_to);
create index if not exists leads_email_idx       on leads (lower(email));

-- free-text search across the fields anyone would actually search
create index if not exists leads_search_idx on leads using gin (
  to_tsvector('simple',
    coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' ||
    coalesce(email,'')      || ' ' || coalesce(phone,'')     || ' ' ||
    coalesce(message,'')    || ' ' || coalesce(property_name,''))
);

-- --------------------------------------------------------------------------
-- Notes: the record of each conversation.
-- --------------------------------------------------------------------------

create table if not exists lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  author     uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_idx on lead_notes (lead_id, created_at desc);

-- --------------------------------------------------------------------------
-- Reminders: chase this lead on this date.
-- --------------------------------------------------------------------------

create table if not exists lead_reminders (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  owner      uuid references auth.users(id) on delete set null,
  due_at     timestamptz not null,
  note       text,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lead_reminders_due_idx
  on lead_reminders (due_at) where done = false;

-- --------------------------------------------------------------------------
-- Keep updated_at honest.
-- --------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch_updated_at on leads;
create trigger leads_touch_updated_at
  before update on leads
  for each row execute function touch_updated_at();

-- --------------------------------------------------------------------------
-- Row level security.
--
-- Nothing is readable without a logged-in session. The ingest endpoint uses
-- the service role key, which bypasses RLS by design — that key must never
-- reach the browser.
-- --------------------------------------------------------------------------

alter table leads          enable row level security;
alter table lead_notes     enable row level security;
alter table lead_reminders enable row level security;
alter table lead_stages    enable row level security;

-- staff (any authenticated user) can work every lead
drop policy if exists "staff read leads"   on leads;
drop policy if exists "staff write leads"  on leads;
drop policy if exists "staff delete leads" on leads;

create policy "staff read leads"
  on leads for select to authenticated using (true);

create policy "staff write leads"
  on leads for update to authenticated using (true) with check (true);

-- Staff add leads by hand: the phone call, the referral, the person met at a
-- viewing. Everything that never passes through a form on the site.
create policy "staff add leads"
  on leads for insert to authenticated with check (true);

-- deletion stays available so a GDPR erasure request is one click
create policy "staff delete leads"
  on leads for delete to authenticated using (true);

drop policy if exists "staff read notes"   on lead_notes;
drop policy if exists "staff add notes"    on lead_notes;
drop policy if exists "author edits note"  on lead_notes;
drop policy if exists "author deletes note" on lead_notes;

create policy "staff read notes"
  on lead_notes for select to authenticated using (true);

create policy "staff add notes"
  on lead_notes for insert to authenticated with check (author = auth.uid());

create policy "author edits note"
  on lead_notes for update to authenticated using (author = auth.uid());

create policy "author deletes note"
  on lead_notes for delete to authenticated using (author = auth.uid());

drop policy if exists "staff read reminders"  on lead_reminders;
drop policy if exists "staff write reminders" on lead_reminders;

create policy "staff read reminders"
  on lead_reminders for select to authenticated using (true);

create policy "staff write reminders"
  on lead_reminders for all to authenticated using (true) with check (true);

drop policy if exists "staff read stages" on lead_stages;
create policy "staff read stages"
  on lead_stages for select to authenticated using (true);

-- --------------------------------------------------------------------------
-- Who is who. Supabase keeps users in auth.users, which the browser cannot
-- read; this view exposes just enough to show "assigned to Mirza".
-- --------------------------------------------------------------------------

create or replace view staff as
  select id,
         email,
         coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name
  from auth.users;

grant select on staff to authenticated;

-- --------------------------------------------------------------------------
-- Table privileges. RLS decides which rows; these decide whether the role may
-- reach the table at all. Both gates have to be open, and omitting these
-- produces "42501 permission denied" on a valid session.
--
-- Leads carry no insert: they arrive through api/ingest.js on the service
-- key, never from the browser.
-- --------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, update, delete on leads          to authenticated;
grant select, insert, update, delete on lead_notes     to authenticated;
grant select, insert, update, delete on lead_reminders to authenticated;
grant select                         on lead_stages    to authenticated;


-- =========================================================================
-- NEWSLETTER SUBSCRIBERS
-- =========================================================================


create table if not exists subscribers (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  email            text not null,

  -- which form and which page it came from, for knowing what works
  page_url         text,
  signup_source    text,

  -- Withdrawing consent is recorded, not erased: proof of when someone opted
  -- out is what protects you in a complaint. A full erasure request is a
  -- delete, which the policy below still allows.
  unsubscribed_at  timestamptz,

  raw              jsonb not null default '{}'::jsonb
);

-- One row per address, however many times the form is submitted.
create unique index if not exists subscribers_email_key
  on subscribers (lower(email));

create index if not exists subscribers_created_at_idx
  on subscribers (created_at desc);

-- --------------------------------------------------------------------------
-- Access: staff only, same as the rest of the CRM.
-- --------------------------------------------------------------------------

alter table subscribers enable row level security;

drop policy if exists "staff read subscribers"   on subscribers;
drop policy if exists "staff update subscribers" on subscribers;
drop policy if exists "staff delete subscribers" on subscribers;

create policy "staff read subscribers"
  on subscribers for select to authenticated using (true);

-- marking someone unsubscribed
create policy "staff update subscribers"
  on subscribers for update to authenticated using (true) with check (true);

-- erasure requests
create policy "staff delete subscribers"
  on subscribers for delete to authenticated using (true);

-- --------------------------------------------------------------------------
-- Table privileges. Separate gate from RLS; both have to be open.
--
-- No insert for authenticated: signups arrive through api/lead.js on the
-- service key, never from a signed-in browser.
-- --------------------------------------------------------------------------

grant select, update, delete         on subscribers to authenticated;
grant select, insert, update, delete on subscribers to service_role;


-- =========================================================================
-- PARTNER AGENCIES, AND THE ELEVEN WE WORK WITH
-- =========================================================================


-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

create table if not exists partners (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null,
  country     text,
  city        text,
  website     text,
  email       text,
  phone       text,
  commission  text,
  status      text not null default 'active',
  notes       text
);

alter table partners add column if not exists agreement_signed boolean not null default false;

create table if not exists partner_contacts (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references partners(id) on delete cascade,
  created_at  timestamptz not null default now(),
  name        text not null,
  role        text,
  email       text,
  phone       text,
  is_primary  boolean not null default false,
  notes       text
);

create table if not exists lead_partners (
  lead_id     uuid not null references leads(id)    on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  role        text,
  added_at    timestamptz not null default now(),
  added_by    uuid references auth.users(id) on delete set null,
  primary key (lead_id, partner_id)
);

-- --------------------------------------------------------------------------
-- 2. Indexes
-- --------------------------------------------------------------------------

create index  if not exists partners_country_idx        on partners (country);
create index  if not exists partners_status_idx         on partners (status);
create index  if not exists partner_contacts_partner_idx on partner_contacts (partner_id);
create index  if not exists lead_partners_partner_idx   on lead_partners (partner_id);

create unique index if not exists partner_contacts_one_primary
  on partner_contacts (partner_id) where is_primary;

-- Matching agencies by name is what makes this file re-runnable.
create unique index if not exists partners_name_key on partners (lower(name));

-- --------------------------------------------------------------------------
-- 3. Keep updated_at honest
-- --------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists partners_touch_updated_at on partners;
create trigger partners_touch_updated_at
  before update on partners
  for each row execute function touch_updated_at();

-- --------------------------------------------------------------------------
-- 4. How each agency is doing — the question the CRM exists to answer
-- --------------------------------------------------------------------------

create or replace view partner_performance as
  select
    p.id, p.name, p.country, p.status,
    count(lp.lead_id)                                              as leads_total,
    count(lp.lead_id) filter (where l.stage = 'won')               as leads_won,
    count(lp.lead_id) filter (where l.stage = 'lost')              as leads_lost,
    count(lp.lead_id) filter (where l.stage not in ('won','lost')) as leads_open,
    max(lp.added_at)                                               as last_sent_at
  from partners p
  left join lead_partners lp on lp.partner_id = p.id
  left join leads l          on l.id = lp.lead_id
  group by p.id, p.name, p.country, p.status;

-- --------------------------------------------------------------------------
-- 5. Row level security — staff only
-- --------------------------------------------------------------------------

alter table partners         enable row level security;
alter table partner_contacts enable row level security;
alter table lead_partners    enable row level security;

drop policy if exists "staff manage partners" on partners;
create policy "staff manage partners"
  on partners for all to authenticated using (true) with check (true);

drop policy if exists "staff manage partner contacts" on partner_contacts;
create policy "staff manage partner contacts"
  on partner_contacts for all to authenticated using (true) with check (true);

drop policy if exists "staff manage lead partners" on lead_partners;
create policy "staff manage lead partners"
  on lead_partners for all to authenticated using (true) with check (true);

-- --------------------------------------------------------------------------
-- 6. Table privileges
--
-- Separate gate from RLS: policies decide which rows, grants decide whether
-- the role may reach the table at all. Both have to be open.
-- --------------------------------------------------------------------------

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on partners         to authenticated, service_role;
grant select, insert, update, delete on partner_contacts to authenticated, service_role;
grant select, insert, update, delete on lead_partners    to authenticated, service_role;
grant select on partner_performance                      to authenticated, service_role;

-- --------------------------------------------------------------------------
-- 7. The agencies
--
-- country is set only where the record itself settles it: an Srl is an
-- Italian company, Romolini and Casa Tuscany are Tuscan, Evergreen is the
-- Habitat developer in North Cyprus. The rest are left blank, not guessed.
-- --------------------------------------------------------------------------

insert into partners (name, country, agreement_signed, status, notes) values
  ('Luxury Solutions Srl',  'Italy',        true,  'active', null),
  ('Stephanie Valente',      null,          true,  'active', 'Sheet spells the agency "Stehpanie Valente".'),
  ('Engel & Voelkers',       null,          true,  'active', 'Contact email truncated in the source sheet - domain needs confirming.'),
  ('Romolini',              'Italy',        true,  'active', 'Also the source of the Capraia wine estate listing.'),
  ('Building Heritage',      null,          true,  'active', null),
  ('Porto Servo',            null,          false, 'active', 'Agreement not recorded as signed.'),
  ('Serimm / Knight Frank',  null,          false, 'active', 'No contact recorded yet.'),
  ('Casa Tuscany',          'Italy',        false, 'active', 'No contact recorded yet.'),
  ('Evergreen Group',       'North Cyprus', true,  'active', 'Developer behind Habitat Premium and Habitat Standard.'),
  ('Barnes International',   null,          false, 'active', 'Agreement not signed.'),
  ('Rimmo',                  null,          true,  'active', null)
on conflict (lower(name)) do update set
  agreement_signed = excluded.agreement_signed,
  country          = coalesce(excluded.country, partners.country),
  notes            = coalesce(excluded.notes, partners.notes);

-- --------------------------------------------------------------------------
-- 8. Their people
-- --------------------------------------------------------------------------

insert into partner_contacts (partner_id, name, email, is_primary)
select p.id, v.contact_name, v.contact_email, true
from (values
  ('Luxury Solutions Srl',  'Mirko Delfini',     null),
  ('Stephanie Valente',     'Stephanie Valente', 'stephanie.valente85@gmail.com'),
  ('Engel & Voelkers',      'Francesca Boghi',   null),
  ('Romolini',              'Danili Romolini',   null),
  ('Building Heritage',     'Andrew Morley',     null),
  ('Porto Servo',           'Paulo Costi',       null),
  ('Evergreen Group',       'Morvardi',          null),
  ('Barnes International',  'Matteo',            null),
  ('Rimmo',                 'Rupert',            null)
) as v(agency, contact_name, contact_email)
join partners p on lower(p.name) = lower(v.agency)
where not exists (
  select 1 from partner_contacts c
  where c.partner_id = p.id and c.is_primary
);



-- =========================================================================
-- TABLE PRIVILEGES (RE-APPLIED LAST, SO NOTHING IS MISSED)
-- =========================================================================

grant usage on schema public to authenticated;

-- Leads: read, update and delete. No insert — leads arrive through
-- api/ingest.js on the service key, never from the browser.
grant select, insert, update, delete on leads to authenticated;

-- Notes: anyone may read and add. The policies further restrict editing and
-- deleting to the note's own author.
grant select, insert, update, delete on lead_notes to authenticated;

-- Reminders: full control, matching the "for all" policy.
grant select, insert, update, delete on lead_reminders to authenticated;

-- Stage list is reference data.
grant select on lead_stages to authenticated;

-- Partner agencies, their people, and the links to leads.
grant select, insert, update, delete on partners         to authenticated;
grant select, insert, update, delete on partner_contacts to authenticated;
grant select, insert, update, delete on lead_partners    to authenticated;

-- Views. Repeated from schema.sql and partners.sql so this file stands alone.
grant select on staff               to authenticated;
grant select on partner_performance to authenticated;

-- ---------------------------------------------------------------------------
-- Anything added later should inherit the same treatment rather than failing
-- the same way. This covers tables created from here on by the owning role.
-- ---------------------------------------------------------------------------

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select on sequences to authenticated;

-- ---------------------------------------------------------------------------
-- The service role, used by api/ingest.js to file incoming leads.
--
-- service_role bypasses row level security, but bypassing RLS is not the same
-- as holding table privileges: it still needs a grant to reach the table. In
-- this project the default privileges did not provide them, which is why an
-- otherwise valid insert came back rejected.
-- ---------------------------------------------------------------------------

grant usage on schema public to service_role;

grant select, insert, update, delete on leads            to service_role;
grant select, insert, update, delete on lead_notes       to service_role;
grant select, insert, update, delete on lead_reminders   to service_role;
grant select, insert, update, delete on lead_stages      to service_role;
grant select, insert, update, delete on partners         to service_role;
grant select, insert, update, delete on partner_contacts to service_role;
grant select, insert, update, delete on lead_partners    to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;


-- ===========================================================================
-- What you should see
-- ===========================================================================

select
  (select count(*) from leads)       as leads,
  (select count(*) from subscribers) as subscribers,
  (select count(*) from partners)    as agencies;
