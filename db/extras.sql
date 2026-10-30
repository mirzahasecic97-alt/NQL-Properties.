-- What else a client wants arranged around the stay or the purchase: a
-- jet, a car and driver, a chef, a boat. Ticked on the contact form since
-- 30 Oct 2026; the API writes the ticks here as one line. Run in the
-- Supabase SQL editor. Safe to run twice.
alter table leads add column if not exists extras text;
comment on column leads.extras is 'Also arrange: the services ticked on the contact form, comma separated. Shown in the CRM as Also arrange.';
select count(*) filter (where extras is not null) as leads_with_extras from leads;
