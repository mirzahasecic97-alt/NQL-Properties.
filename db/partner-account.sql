-- ---------------------------------------------------------------------------
-- NQL Properties — give an agency a login
--
-- Two steps, and the first one is not SQL.
--
-- 1. Supabase dashboard, Authentication, Users, "Add user".
--    Use the agency person's real email. Set a password and send it to them
--    yourself; do not use the invite flow unless you have checked where the
--    invite link points.
--
-- 2. Edit the three values below and run this. Until it runs, that account
--    can sign in and will see nothing at all, which is the intended state
--    for an account on neither list.
-- ---------------------------------------------------------------------------

-- Change these three.
\set agency_name  'Evergreen Group'
\set login_email  'name@evergreengroup.com'
\set person_name  'Their Name'

-- The Supabase SQL editor does not support \set, so the values are repeated
-- inline below. Edit them in the insert itself.

insert into partner_users (user_id, partner_id, name)
select u.id,
       p.id,
       'Their Name'                                   -- the person
  from auth.users u
  join partners  p on lower(p.name) = lower('Evergreen Group')  -- the agency
 where lower(u.email) = lower('name@evergreengroup.com')        -- the login
on conflict (user_id) do update
  set partner_id = excluded.partner_id,
      name       = excluded.name,
      status     = 'active';

-- An agency account must never also be staff. Belt and braces: the seed in
-- partner-portal.sql only caught accounts that existed when it ran, and this
-- one did not.
delete from nql_staff
 where user_id in (select user_id from partner_users);

-- Who can get in, and as what.
select coalesce(p.name, 'NQL') as belongs_to,
       u.email,
       case when ns.user_id is not null then 'staff' else 'agency' end as kind,
       pu.status
  from auth.users u
  left join nql_staff     ns on ns.user_id = u.id
  left join partner_users pu on pu.user_id = u.id
  left join partners      p  on p.id       = pu.partner_id
 order by kind, u.email;
