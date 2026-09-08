-- ---------------------------------------------------------------------------
-- NQL Properties — the columns and tables the board needs
--
-- Part 1 of 4. Run them in order. The Supabase editor runs everything you
-- paste as one transaction, so a single bad line rolls the whole thing back.
-- Split up, a failure lands on one part and the parts before it stay done.
-- ---------------------------------------------------------------------------

create table if not exists partner_countries (
  partner_id uuid not null references partners(id) on delete cascade,
  country    text not null,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id) on delete set null,
  primary key (partner_id, country)
);

create table if not exists lead_partners (
  lead_id     uuid not null references leads(id)    on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  role        text,
  added_at    timestamptz not null default now(),
  added_by    uuid references auth.users(id) on delete set null,
  primary key (lead_id, partner_id)
);

grant select, insert, update, delete on partner_countries to authenticated;

alter table partners      add column if not exists sees_leads boolean not null default true;
alter table lead_partners add column if not exists granted    boolean not null default false;

alter table leads add column if not exists lead_no          text;
alter table leads add column if not exists deal_value       numeric;
alter table leads add column if not exists country          text;
alter table leads add column if not exists match_score      smallint;
alter table leads add column if not exists intro_consent    text;
alter table leads add column if not exists based_in         text;
alter table leads add column if not exists location_detail  text;
alter table leads add column if not exists property_kinds   text;
alter table leads add column if not exists project_interest text;
alter table leads add column if not exists bedrooms         text;
alter table leads add column if not exists land             text;
alter table leads add column if not exists must_haves       text;
alter table leads add column if not exists dealbreakers     text;
alter table leads add column if not exists timeline         text;
alter table leads add column if not exists purpose          text;
