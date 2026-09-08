-- ---------------------------------------------------------------------------
-- NQL Properties — a salesperson's notes and reminders, and nobody else's
--
-- db/guy-sales.sql restricted the leads table and nothing else, so a
-- salesperson can still read every note and every reminder in the CRM through
-- the API, including on leads they cannot see.
--
-- Written defensively because the last version failed and I do not have the
-- error. Three things that could go wrong are handled rather than assumed:
--
--   * is_full_staff() may not exist. It is created here rather than expected.
--   * can_see_lead() may already exist with a differently named argument, and
--     create or replace cannot rename one. It is dropped first.
--   * a policy may exist under a name I have not guessed. Every policy on both
--     tables is dropped by reading the catalogue, not by naming them, so
--     nothing can survive and quietly re-open the table with an OR.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. The two tests
-- --------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.nql_staff') is null then
    raise exception
      'nql_staff does not exist, so there are no roles to test. Run db/owner-role.sql first.';
  end if;
end $$;

create or replace function public.is_full_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nql_staff
     where user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

-- Dropped rather than replaced: an existing copy with a different argument
-- name cannot be replaced, only dropped, and that error reads as though the
-- function is fine when it is the argument that is wrong.
drop function if exists public.can_see_lead(uuid);

create function public.can_see_lead(lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_full_staff()
      or exists (
        select 1 from leads where id = lead and assigned_to = auth.uid()
      );
$$;

grant execute on function public.is_full_staff()    to authenticated;
grant execute on function public.can_see_lead(uuid) to authenticated;


-- --------------------------------------------------------------------------
-- 2. Clear both tables completely, then say the one thing that is true
--
-- Postgres combines policies with OR, so a single survivor under a name I did
-- not think of would undo all of this. Reading the catalogue removes the
-- guessing.
-- --------------------------------------------------------------------------

do $$
declare
  t text;
  pol text;
begin
  foreach t in array array['lead_notes', 'lead_reminders']
  loop
    if to_regclass('public.' || t) is null then
      raise notice '% does not exist, skipped.', t;
      continue;
    end if;

    for pol in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on %I', pol, t);
    end loop;

    execute format(
      'create policy "staff read %1$s" on %1$I for select to authenticated
         using (public.can_see_lead(lead_id))', t);

    execute format(
      'create policy "staff write %1$s" on %1$I for all to authenticated
         using (public.can_see_lead(lead_id))
         with check (public.can_see_lead(lead_id))', t);

    raise notice '% restricted to the leads each person can see.', t;
  end loop;
end $$;


-- --------------------------------------------------------------------------
-- 3. What is actually on those tables now
--
-- Two rows per table, both mentioning can_see_lead. Anything else, or
-- anything saying true, means something survived.
-- --------------------------------------------------------------------------

select tablename, policyname, cmd, qual
  from pg_policies
 where schemaname = 'public'
   and tablename in ('lead_notes', 'lead_reminders')
 order by tablename, cmd, policyname;
