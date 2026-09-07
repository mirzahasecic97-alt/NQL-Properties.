-- ---------------------------------------------------------------------------
-- Undo the admin and sales split.
--
-- Puts every table back to "any signed-in member of staff sees everything",
-- which is where the CRM was before roles were introduced.
--
-- staff_roles and the is_admin() helper are left in place but unused, so the
-- split can be switched back on later without rebuilding it. Nothing reads
-- them once this has run.
--
-- Run the whole file in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- leads
drop policy if exists "read leads"   on leads;
drop policy if exists "edit leads"   on leads;
drop policy if exists "add leads"    on leads;
drop policy if exists "delete leads" on leads;

create policy "staff read leads"   on leads for select to authenticated using (true);
create policy "staff write leads"  on leads for update to authenticated using (true) with check (true);
create policy "staff add leads"    on leads for insert to authenticated with check (true);
create policy "staff delete leads" on leads for delete to authenticated using (true);

-- anything hanging off a lead
drop policy if exists "notes follow lead"         on lead_notes;
drop policy if exists "reminders follow lead"     on lead_reminders;
drop policy if exists "lead partners follow lead" on lead_partners;

create policy "staff read notes"  on lead_notes for select to authenticated using (true);
create policy "staff write notes" on lead_notes for all    to authenticated using (true) with check (true);
create policy "staff read reminders"  on lead_reminders for select to authenticated using (true);
create policy "staff write reminders" on lead_reminders for all    to authenticated using (true) with check (true);
create policy "staff manage lead partners" on lead_partners for all to authenticated using (true) with check (true);

-- agencies and subscribers
drop policy if exists "admin partners"         on partners;
drop policy if exists "read active partners"   on partners;
drop policy if exists "admin partner contacts" on partner_contacts;
drop policy if exists "read active contacts"   on partner_contacts;
drop policy if exists "admin subscribers"      on subscribers;

create policy "staff manage partners" on partners for all to authenticated using (true) with check (true);
create policy "staff manage partner contacts" on partner_contacts for all to authenticated using (true) with check (true);
create policy "staff read subscribers"   on subscribers for select to authenticated using (true);
create policy "staff update subscribers" on subscribers for update to authenticated using (true) with check (true);
create policy "staff delete subscribers" on subscribers for delete to authenticated using (true);

-- tasks
drop policy if exists "read tasks"   on tasks;
drop policy if exists "add tasks"    on tasks;
drop policy if exists "edit tasks"   on tasks;
drop policy if exists "delete tasks" on tasks;

create policy "staff read tasks"   on tasks for select to authenticated using (true);
create policy "staff add tasks"    on tasks for insert to authenticated with check (true);
create policy "staff edit tasks"   on tasks for update to authenticated using (true) with check (true);
create policy "staff delete tasks" on tasks for delete to authenticated using (true);

select 'roles are no longer enforced; every signed-in account sees everything' as status;
