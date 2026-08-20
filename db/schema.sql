-- ---------------------------------------------------------------------------
-- NQL Properties CRM — database schema
--
-- Run this once in the Supabase SQL editor (Frankfurt project).
-- Safe to re-run: every statement is guarded.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

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

grant select, update, delete         on leads          to authenticated;
grant select, insert, update, delete on lead_notes     to authenticated;
grant select, insert, update, delete on lead_reminders to authenticated;
grant select                         on lead_stages    to authenticated;

