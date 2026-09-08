-- ---------------------------------------------------------------------------
-- NQL Properties — put the test account back on the agency list
--
-- WHAT HAPPENED
--
-- partner-portal.sql seeds nql_staff from every account that is not already an
-- agency user. That is right the first time it runs, when the only accounts
-- are the team. It is wrong every time after, because an agency login created
-- since then is not on partner_users yet and gets scooped up as staff.
--
-- mirzatest@gmail.com ended up on the staff list, so partner-test-account.sql
-- refused to link it: an account is staff or agency, never both. The portal
-- then said, correctly, that it is not linked to an agency.
--
-- This puts it right, and stops the seed doing it again.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

do $$
declare
  test_email text := 'mirzatest@gmail.com';
  uid uuid;
  pid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(test_email);
  if uid is null then
    raise exception 'There is no account for %. Create it under Authentication, Users.', test_email;
  end if;

  -- Never let this run against a real person. The owner losing their CRM
  -- access to a test script is not a recoverable afternoon.
  if exists (select 1 from nql_staff where user_id = uid and role = 'owner') then
    raise exception '% is the owner. Refusing to turn the owner into an agency user.', test_email;
  end if;

  -- The agency it belongs to.
  if not exists (select 1 from partners where name = 'ZZ Test Agency') then
    insert into partners (name, country, city, status, notes)
    values ('ZZ Test Agency', null, 'Perugia', 'paused',
            'Not a real agency. For testing the partner portal. Safe to delete.');
  end if;
  select id into pid from partners where name = 'ZZ Test Agency';

  -- Off the staff list first, or the two lists disagree about what it is.
  delete from nql_staff where user_id = uid;

  insert into partner_users (user_id, partner_id, name, status)
  values (uid, pid, 'Portal test', 'active')
  on conflict (user_id) do update
    set partner_id = excluded.partner_id,
        status     = 'active';

  raise notice '% is now an agency user at ZZ Test Agency.', test_email;
end $$;


-- --------------------------------------------------------------------------
-- Stop the seed doing this again.
--
-- It should only fill an empty staff list. Once there is a team, adding
-- somebody is a deliberate act in the Control panel, not a side effect of
-- re-running a migration.
-- --------------------------------------------------------------------------

create or replace function public.seed_nql_staff()
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from nql_staff) then
    raise notice 'nql_staff already has people on it. Nothing seeded.';
    return;
  end if;
  insert into nql_staff (user_id)
  select id from auth.users
   where id not in (select user_id from partner_users)
  on conflict (user_id) do nothing;
end;
$$;


-- --------------------------------------------------------------------------
-- Which list every account is on. Nobody should appear on both.
-- --------------------------------------------------------------------------

select u.email,
       case
         when ns.user_id is not null and pu.user_id is not null then 'BOTH, which is wrong'
         when ns.user_id is not null then 'NQL staff, ' || ns.role
         when pu.user_id is not null then 'agency: ' || p.name
         else 'neither, sees nothing'
       end as list
  from auth.users u
  left join nql_staff     ns on ns.user_id = u.id
  left join partner_users pu on pu.user_id = u.id
  left join partners      p  on p.id = pu.partner_id
 order by 2, 1;
