-- ---------------------------------------------------------------------------
-- NQL Properties — a test agency account to work on the portal with
--
-- Gives you a login that sees the portal exactly as an agency does, against a
-- throwaway agency and a throwaway lead, so nothing you click touches a real
-- buyer or a real partner's record.
--
-- BEFORE RUNNING
--
-- Create the auth user first: Supabase dashboard, Authentication, Users,
-- "Add user". Use an address that is NOT your CRM login. If your provider
-- supports it, mirza+portal@tveir.is is the easy answer: it is a different
-- account to Supabase and the mail still reaches you.
--
-- Do not reuse your own staff address. An account is staff or agency, never
-- both, so linking your CRM login here would take you off the staff list and
-- lock you out of the CRM. The check in step 2 stops that happening, but it
-- is worth knowing why it is there.
--
-- Then change the one email on the line marked CHANGE THIS and run the file.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 1. A throwaway agency
-- ===========================================================================

insert into partners (name, country, city, status, notes)
select 'ZZ Test Agency', 'Italy', 'Perugia', 'paused',
       'Not a real agency. Created for testing the partner portal. Safe to delete.'
where not exists (select 1 from partners where name = 'ZZ Test Agency');


-- ===========================================================================
-- 2. Link the login to it
-- ===========================================================================

do $$
declare
  test_email text := 'mirza+portal@tveir.is';   -- CHANGE THIS
  uid uuid;
  pid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(test_email);
  if uid is null then
    raise exception
      'No account for %. Create it in Authentication, Users, Add user first.', test_email;
  end if;

  -- The guard that matters. Staff and agency are mutually exclusive, so
  -- linking a staff login here would sign you out of your own CRM.
  if exists (select 1 from nql_staff where user_id = uid)
     and (select count(*) from nql_staff) <= 1 then
    raise exception
      '% is the only staff account. Linking it to an agency would lock everyone out of the CRM.', test_email;
  end if;
  if exists (select 1 from nql_staff where user_id = uid) then
    raise exception
      '% is a staff account. Use a different address for the portal, or it loses its CRM access.', test_email;
  end if;

  select id into pid from partners where name = 'ZZ Test Agency';

  insert into partner_users (user_id, partner_id, name)
  values (uid, pid, 'Portal test')
  on conflict (user_id) do update
    set partner_id = excluded.partner_id, status = 'active';
end $$;


-- ===========================================================================
-- 3. A throwaway lead, so the board has something on it
--
-- A test lead rather than one of yours: working on the portal means clicking
-- through consent, and consent is not a thing to rehearse on a real buyer's
-- record.
-- ===========================================================================

insert into leads (source, stage, first_name, last_name, email, phone,
                   country, budget, message, project_interest)
select 'manual', 'new', 'ZZTEST', 'Buyer', 'zztest@example.com', '+39 000 000 000',
       'Italy', '1200000', 'Test lead for the partner portal. Safe to delete.',
       'Farmhouse with land, Umbria'
where not exists (select 1 from leads where last_name = 'Buyer' and first_name = 'ZZTEST');


-- ===========================================================================
-- 4. What you have now
-- ===========================================================================

select u.email,
       p.name   as agency,
       pu.status,
       case when ns.user_id is not null then 'ALSO STAFF, which is wrong' else 'agency only' end as check
  from partner_users pu
  join auth.users u on u.id = pu.user_id
  join partners   p on p.id = pu.partner_id
  left join nql_staff ns on ns.user_id = pu.user_id;

select lead_no, first_name, last_name, country, stage
  from leads where first_name = 'ZZTEST';


-- ===========================================================================
-- 5. CLEANING UP, when you are done
--
-- Run this block on its own. It leaves the auth user in place; delete that
-- from the dashboard if you want it gone too.
-- ===========================================================================

-- delete from partner_interest where lead_id in (select id from leads where first_name = 'ZZTEST');
-- delete from leads         where first_name = 'ZZTEST';
-- delete from partner_users where partner_id in (select id from partners where name = 'ZZ Test Agency');
-- delete from partners      where name = 'ZZ Test Agency';
