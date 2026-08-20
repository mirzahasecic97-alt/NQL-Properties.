-- ---------------------------------------------------------------------------
-- NQL Properties CRM — table privileges
--
-- Run this once in the Supabase SQL editor, after schema.sql and partners.sql.
-- Safe to re-run.
--
-- Row level security and table privileges are two different gates in Postgres,
-- and both have to be open. The policies in schema.sql decide WHICH ROWS a
-- signed-in member of staff may touch; these grants decide whether the role
-- may touch the table at all. Without them PostgREST returns
--
--   42501  permission denied for table leads
--
-- even for a perfectly valid session. The views already carried their own
-- grants, which is why "staff" loaded and "leads" did not.
--
-- Each grant below is deliberately no wider than the matching policy.
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

-- Leads: read, update and delete. No insert — leads arrive through
-- api/ingest.js on the service key, never from the browser.
grant select, update, delete on leads to authenticated;

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
