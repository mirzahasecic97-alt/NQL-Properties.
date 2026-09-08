-- ---------------------------------------------------------------------------
-- NQL Properties — a salesperson's notes and reminders, and nobody else's
--
-- This version cannot fail.
--
-- Three attempts at this have failed and I have never seen the error, so
-- every step is wrapped in its own handler that records what happened into a
-- table. The script always succeeds, and the LAST RESULT tells us exactly
-- which step went wrong and what Postgres said about it.
--
-- Run the whole thing and send back the two result grids. Nothing here can
-- leave the database in a worse state than it found it: a step that fails
-- rolls back on its own and the rest carry on.
-- ---------------------------------------------------------------------------

drop table if exists migration_report;
create temporary table migration_report (
  step  int,
  what  text,
  ok    boolean,
  detail text
);

do $$
declare
  t text;
  pol text;
  n int;
begin

  ---------------------------------------------------------------- 1
  begin
    if to_regclass('public.nql_staff') is null then
      raise exception 'nql_staff does not exist. Run db/owner-role.sql first.';
    end if;
    insert into migration_report values (1, 'nql_staff exists', true, null);
  exception when others then
    insert into migration_report values (1, 'nql_staff exists', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 2
  begin
    execute $f$
      create or replace function public.is_full_staff()
      returns boolean language sql stable security definer set search_path = public as $b$
        select exists (
          select 1 from nql_staff
           where user_id = auth.uid() and role in ('owner', 'admin')
        );
      $b$;
    $f$;
    insert into migration_report values (2, 'is_full_staff() created', true, null);
  exception when others then
    insert into migration_report values (2, 'is_full_staff() created', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 3
  begin
    execute 'drop function if exists public.can_see_lead(uuid)';
    execute $f$
      create function public.can_see_lead(lead uuid)
      returns boolean language sql stable security definer set search_path = public as $b$
        select public.is_full_staff()
            or exists (select 1 from leads where id = lead and assigned_to = auth.uid());
      $b$;
    $f$;
    insert into migration_report values (3, 'can_see_lead() created', true, null);
  exception when others then
    insert into migration_report values (3, 'can_see_lead() created', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 4
  begin
    execute 'grant execute on function public.is_full_staff() to authenticated';
    execute 'grant execute on function public.can_see_lead(uuid) to authenticated';
    insert into migration_report values (4, 'functions granted', true, null);
  exception when others then
    insert into migration_report values (4, 'functions granted', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 5 and 6
  foreach t in array array['lead_notes', 'lead_reminders']
  loop
    begin
      if to_regclass('public.' || t) is null then
        insert into migration_report values (5, t, false, 'table does not exist');
        continue;
      end if;

      -- Dropped from the catalogue rather than by name. Postgres combines
      -- policies with OR, so one survivor under a name I never guessed would
      -- undo everything else here.
      n := 0;
      for pol in
        select policyname from pg_policies where schemaname = 'public' and tablename = t
      loop
        execute format('drop policy %I on %I', pol, t);
        n := n + 1;
      end loop;

      execute format(
        'create policy "staff read %1$s" on %1$I for select to authenticated
           using (public.can_see_lead(lead_id))', t);

      execute format(
        'create policy "staff write %1$s" on %1$I for all to authenticated
           using (public.can_see_lead(lead_id))
           with check (public.can_see_lead(lead_id))', t);

      execute format('grant select, insert, update, delete on %I to authenticated', t);

      insert into migration_report
        values (5, t || ' restricted', true, 'dropped ' || n || ' old policies');
    exception when others then
      insert into migration_report values (5, t || ' restricted', false, SQLERRM);
    end;
  end loop;

end $$;


-- ===========================================================================
-- RESULT ONE — what happened. Send me this.
-- ===========================================================================
select step, what, ok, detail from migration_report order by step, what;


-- ===========================================================================
-- RESULT TWO — what is on those tables now.
--
-- Two rows per table, both mentioning can_see_lead. Anything saying true
-- means something survived and everybody still reads everything.
-- ===========================================================================
select tablename, policyname, cmd, qual
  from pg_policies
 where schemaname = 'public'
   and tablename in ('lead_notes', 'lead_reminders')
 order by tablename, cmd, policyname;
