-- ---------------------------------------------------------------------------
-- NQL Properties CRM — partner agencies
--
-- Run after schema.sql, in the same Supabase project.
-- Safe to re-run.
--
-- `assigned_to` on a lead is one of us. This is the other side: the agency
-- and the person there that a lead was passed to.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- The agencies themselves.
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

  -- how the deal works, kept as free text: every arrangement differs and a
  -- rigid schema here would be wrong within a month
  commission  text,

  status      text not null default 'active',  -- active | paused | former
  notes       text
);

create index if not exists partners_name_idx    on partners (lower(name));
create index if not exists partners_country_idx on partners (country);
create index if not exists partners_status_idx  on partners (status);

-- --------------------------------------------------------------------------
-- People at those agencies.
-- --------------------------------------------------------------------------

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

create index if not exists partner_contacts_partner_idx on partner_contacts (partner_id);

-- one primary contact per agency, at most
create unique index if not exists partner_contacts_one_primary
  on partner_contacts (partner_id) where is_primary;

-- --------------------------------------------------------------------------
-- Which partners are on which lead. A lead can involve more than one.
-- --------------------------------------------------------------------------

create table if not exists lead_partners (
  lead_id     uuid not null references leads(id)    on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  role        text,                       -- Listing agent, Introduced by, Co-broker
  added_at    timestamptz not null default now(),
  added_by    uuid references auth.users(id) on delete set null,
  primary key (lead_id, partner_id)
);

create index if not exists lead_partners_partner_idx on lead_partners (partner_id);

-- --------------------------------------------------------------------------
-- Keep updated_at honest.
-- --------------------------------------------------------------------------

drop trigger if exists partners_touch_updated_at on partners;
create trigger partners_touch_updated_at
  before update on partners
  for each row execute function touch_updated_at();

-- --------------------------------------------------------------------------
-- How each partner is actually doing. The question the CRM exists to answer:
-- we send them leads, do any of them close?
-- --------------------------------------------------------------------------

create or replace view partner_performance as
  select
    p.id,
    p.name,
    p.country,
    p.status,
    count(lp.lead_id)                                          as leads_total,
    count(lp.lead_id) filter (where l.stage = 'won')            as leads_won,
    count(lp.lead_id) filter (where l.stage = 'lost')           as leads_lost,
    count(lp.lead_id) filter (where l.stage not in ('won','lost')) as leads_open,
    max(lp.added_at)                                            as last_sent_at
  from partners p
  left join lead_partners lp on lp.partner_id = p.id
  left join leads l          on l.id = lp.lead_id
  group by p.id, p.name, p.country, p.status;

grant select on partner_performance to authenticated;

-- --------------------------------------------------------------------------
-- Row level security: staff only, same as everything else.
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
-- Table privileges, as in schema.sql: the policies above govern rows, these
-- govern access to the tables themselves.
-- --------------------------------------------------------------------------

grant select, insert, update, delete on partners         to authenticated;
grant select, insert, update, delete on partner_contacts to authenticated;
grant select, insert, update, delete on lead_partners    to authenticated;

