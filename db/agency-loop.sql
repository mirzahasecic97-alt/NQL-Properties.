-- ---------------------------------------------------------------------------
-- NQL Properties — close the loop with the agencies
--
-- Five things, all the same idea: an introduction should be the start of a
-- conversation rather than the end of a transaction.
--
--   1  an agency says what came of a lead we gave them
--   2  we know when they last looked, so we can mark what is new
--   3  an agency can offer us a property, not only ask about a buyer
--
-- Run after db/partner-portal.sql and db/mandate-fields.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";


-- ===========================================================================
-- 1. WHAT CAME OF IT
--
-- partner_performance measures agencies on our own stage field, which only
-- moves when one of us updates it, and we are not the ones at the viewing.
-- The agency knows a fortnight before we do. This is where they tell us.
-- ===========================================================================

alter table lead_partners add column if not exists outcome text
  check (outcome in ('spoke', 'viewing', 'offer', 'sold', 'cold'));
alter table lead_partners add column if not exists outcome_at   timestamptz;
alter table lead_partners add column if not exists outcome_note text;

comment on column lead_partners.outcome is
  'What the agency says came of the introduction. Theirs to set, ours to read.';

-- They may read and update their own rows, and nothing else. The lead itself
-- stays behind partner_leads, which already checks consent.
drop policy if exists "agency reads own links"  on lead_partners;
drop policy if exists "agency reports outcome"  on lead_partners;
create policy "agency reads own links"
  on lead_partners for select to authenticated
  using (public.can_see_lead(lead_id) or partner_id = public.my_partner_id());
create policy "agency reports outcome"
  on lead_partners for update to authenticated
  using (partner_id = public.my_partner_id())
  with check (partner_id = public.my_partner_id());


-- ===========================================================================
-- 2. WHEN THEY LAST LOOKED
--
-- So the board can mark what has arrived since, instead of an agency reading
-- all forty briefs every morning to find the two that are new.
-- ===========================================================================

alter table partner_users add column if not exists last_seen_at timestamptz;

-- Writing your own timestamp is the one thing an agency user may change about
-- their own row. Everything else about it is ours.
drop policy if exists "agency marks seen" on partner_users;
create policy "agency marks seen"
  on partner_users for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ===========================================================================
-- 3. WHAT THEY HAVE
--
-- An agency could ask about our buyers and never offer us anything. This is
-- the other half of it: they tell us what they have taken on, and we match it
-- to a brief ourselves.
--
-- Deliberately plain. No photographs, no matching, no listing. If agencies
-- use it, it earns the rest; if they do not, nothing was spent on it.
-- ===========================================================================

create table if not exists partner_offers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  partner_id  uuid not null references partners(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,

  title       text not null,
  country     text,
  location    text,
  price       numeric,
  bedrooms    text,
  land        text,
  notes       text,
  link        text,

  -- new        they have told us, nobody has looked
  -- interested we think it fits somebody
  -- passed     not for our buyers
  status      text not null default 'new'
              check (status in ('new', 'interested', 'passed')),
  reply       text,
  decided_at  timestamptz,
  decided_by  uuid references auth.users(id) on delete set null
);

create index if not exists partner_offers_partner_idx on partner_offers (partner_id);
create index if not exists partner_offers_status_idx  on partner_offers (status, created_at desc);

alter table partner_offers enable row level security;

drop policy if exists "agency offers"      on partner_offers;
drop policy if exists "read offers"        on partner_offers;
drop policy if exists "staff answer offers" on partner_offers;

create policy "agency offers"
  on partner_offers for insert to authenticated
  with check (partner_id = public.my_partner_id() and user_id = auth.uid());

create policy "read offers"
  on partner_offers for select to authenticated
  using (public.is_full_staff() or partner_id = public.my_partner_id());

create policy "staff answer offers"
  on partner_offers for all to authenticated
  using (public.is_full_staff()) with check (public.is_full_staff());

grant select, insert, update, delete on partner_offers to authenticated;


-- ===========================================================================
-- 4. WHAT AN AGENCY SEES OF ITS OWN LEADS
--
-- partner_leads gains the outcome, so the portal can show what they last told
-- us and let them change it.
-- ===========================================================================

drop view if exists partner_leads;

create view partner_leads
with (security_barrier = true) as
  select
    l.id, l.lead_no, l.created_at, l.stage, l.country,
    l.first_name, l.last_name, l.email, l.phone,
    l.budget, l.message, l.property_name, l.project_interest,
    l.location_detail, l.property_kinds, l.bedrooms, l.land,
    l.must_haves, l.dealbreakers, l.purpose, l.timeline,
    l.intro_consent_at,
    lp.outcome, lp.outcome_at, lp.outcome_note
  from leads l
  join lead_partners lp on lp.lead_id = l.id
  where public.is_partner_user()
    and lp.partner_id = public.my_partner_id()
    and l.intro_consent = 'yes'
    and l.intro_partner_id = public.my_partner_id();

grant select on partner_leads to authenticated;


-- ===========================================================================
-- 5. WHAT WE SEE OF THEIRS
--
-- One row per agency, for the Agencies tab: how many we sent, how many they
-- have told us anything about, and how many turned into something.
-- ===========================================================================

create or replace view partner_scorecard as
  select
    p.id,
    p.name,
    count(lp.lead_id)                                              as introduced,
    count(lp.outcome)                                              as reported_on,
    count(*) filter (where lp.outcome in ('viewing', 'offer', 'sold')) as progressed,
    count(*) filter (where lp.outcome = 'sold')                    as sold,
    count(*) filter (where lp.outcome = 'cold')                    as went_cold,
    max(lp.outcome_at)                                             as last_heard_from
  from partners p
  left join lead_partners lp on lp.partner_id = p.id
  group by p.id, p.name;

grant select on partner_scorecard to authenticated;


select 'offers' as thing, count(*) from partner_offers
union all
select 'introductions with an outcome', count(outcome) from lead_partners;
