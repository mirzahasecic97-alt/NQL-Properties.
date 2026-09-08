-- ---------------------------------------------------------------------------
-- NQL Properties — a salesperson's notes and reminders, and nobody else's
--
-- db/guy-sales.sql restricted the leads table and nothing else, so a
-- salesperson could still read every note and every reminder in the CRM
-- through the API, including on leads they cannot see. The header counted
-- them, which is how this was noticed.
--
-- Small on purpose, like guy-sales.sql: four statements, so a failure names
-- one thing.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- The test. security definer so it can read leads without tripping the
-- policy on leads, which is the policy that will call it.
create or replace function public.can_see_lead(lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_full_staff()
      or exists (
        select 1 from leads where id = lead and assigned_to = auth.uid()
      );
$$;

grant execute on function public.can_see_lead(uuid) to authenticated;


-- Notes. Replaces, never joins: Postgres combines policies with OR, so one
-- surviving policy saying true would undo this.
drop policy if exists "staff read notes"  on lead_notes;
drop policy if exists "staff add notes"   on lead_notes;
drop policy if exists "staff write notes" on lead_notes;

create policy "staff read notes"
  on lead_notes for select to authenticated using (public.can_see_lead(lead_id));

create policy "staff write notes"
  on lead_notes for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));


-- Reminders.
drop policy if exists "staff read reminders"  on lead_reminders;
drop policy if exists "staff write reminders" on lead_reminders;

create policy "staff read reminders"
  on lead_reminders for select to authenticated using (public.can_see_lead(lead_id));

create policy "staff write reminders"
  on lead_reminders for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));


-- Every policy that can read a note or a reminder. Each should mention
-- can_see_lead. Anything saying true means an older policy survived and
-- everybody still reads everything.
select tablename, policyname, cmd, qual
  from pg_policies
 where schemaname = 'public'
   and tablename in ('lead_notes', 'lead_reminders')
 order by tablename, cmd, policyname;
