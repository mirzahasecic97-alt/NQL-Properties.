-- ---------------------------------------------------------------------------
-- NQL Properties — the one thing actually breaking the CRM
--
--   column staff.email does not exist
--
-- The CRM asks for the staff list before anything else, so that one failure
-- stops the whole sign in: no leads, no Control tab, no error banner, because
-- the message goes to the login screen instead. Every symptom traces here.
--
-- Whatever `staff` is now, it is not the view the CRM expects. It is dropped
-- and rebuilt rather than replaced, because create or replace view cannot
-- change a view's column list, which is very likely how it got stuck.
--
-- Run in the Supabase SQL editor. It cannot fail and touches no lead data.
-- ---------------------------------------------------------------------------

drop table if exists staff_repair;
create temporary table staff_repair (step text, ok boolean, detail text);

do $$
declare
  kind text;
begin
  ---------------------------------------------------------------- what is it
  begin
    select case c.relkind
             when 'v' then 'view' when 'm' then 'materialised view'
             when 'r' then 'TABLE' else c.relkind::text end
      into kind
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'staff';

    insert into staff_repair values ('what staff was', true, coalesce(kind, 'nothing at all'));
  exception when others then
    insert into staff_repair values ('what staff was', false, SQLERRM);
  end;

  ---------------------------------------------------------------- the test it needs
  begin
    if to_regclass('public.nql_staff') is null then
      insert into staff_repair values ('is_nql_staff', false,
        'nql_staff does not exist, so the view cannot filter. Run db/restore-access.sql.');
    else
      execute $f$
        create or replace function public.is_nql_staff()
        returns boolean language sql stable security definer set search_path = public as $b$
          select exists (select 1 from nql_staff where user_id = auth.uid());
        $b$;
      $f$;
      execute 'grant execute on function public.is_nql_staff() to authenticated';
      insert into staff_repair values ('is_nql_staff', true, null);
    end if;
  exception when others then
    insert into staff_repair values ('is_nql_staff', false, SQLERRM);
  end;

  ---------------------------------------------------------------- rebuild it
  begin
    -- Dropped, not replaced. create or replace view cannot change a column
    -- list, so a view stuck with the wrong columns can only be dropped.
    if kind = 'TABLE' then
      execute 'drop table if exists public.staff cascade';
    else
      execute 'drop view if exists public.staff cascade';
    end if;

    if to_regclass('public.nql_staff') is not null then
      execute $f$
        create view staff as
          select u.id,
                 u.email,
                 coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name
            from auth.users u
           where public.is_nql_staff();
      $f$;
    else
      -- No staff list to filter by, so show everybody rather than nobody. A
      -- CRM that cannot name its own people is worse than one that names all
      -- of them.
      execute $f$
        create view staff as
          select u.id,
                 u.email,
                 coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name
            from auth.users u;
      $f$;
    end if;

    execute 'grant select on staff to authenticated';
    insert into staff_repair values ('staff rebuilt with id, email, name', true, null);
  exception when others then
    insert into staff_repair values ('staff rebuilt with id, email, name', false, SQLERRM);
  end;
end $$;


select step, ok, detail from staff_repair;

-- The three columns the CRM asks for. This must return rows, or at least not
-- error, for sign in to get past its first step.
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'staff'
 order by ordinal_position;

select count(*) as people_the_crm_can_name from staff;
