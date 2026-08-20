-- ---------------------------------------------------------------------------
-- NQL Properties — newsletter subscribers
--
-- Run after schema.sql and grants.sql. Safe to re-run.
--
-- Deliberately not a lead. Someone giving an email address for a newsletter
-- has not asked to be sold to, and mixing them into the pipeline would both
-- bury the real enquiries and blur a consent boundary that matters under
-- GDPR: marketing consent is not sales consent.
--
-- The table is therefore narrow on purpose. It holds an address, when it was
-- given and from where — nothing that invites treating a subscriber as a
-- prospect.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

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
