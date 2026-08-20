-- ---------------------------------------------------------------------------
-- NQL Properties — partner agencies, complete install
--
-- Paste this whole file into the Supabase SQL editor and run it once.
--
-- Self-contained on purpose: it creates the tables, the policies, the grants
-- and the eleven agencies in one pass, and every statement is guarded. It does
-- not matter whether partners.sql or grants.sql ran before, or half-ran, or
-- errored. Running it twice changes nothing.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

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

-- --------------------------------------------------------------------------
-- 9. What you should see
-- --------------------------------------------------------------------------

select count(*) as agencies_now_in_crm from partners;
