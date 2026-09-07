-- ---------------------------------------------------------------------------
-- NQL Properties — an owner, and a control panel to be an owner from
--
-- Three levels now, all on the staff list itself:
--
--   owner   can change who has access, to the CRM and to the portal
--   admin   everything except that
--   staff   the same as admin today, kept as a name to grow into
--
-- Only an owner may add or remove a colleague, or hand an agency a login.
-- That is the whole of the difference, and it is the right thing to gate:
-- everything else in the CRM is work, and work should not need permission.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

alter table nql_staff add column if not exists role text not null default 'admin'
  check (role in ('owner', 'admin', 'staff'));

comment on column nql_staff.role is
  'owner may change who has access. admin and staff may not. Everything else is the same for all three.';


-- Mirza is the owner. Named by address rather than by id so this file can be
-- read and checked by a person. One place to change it if it ever moves.
--
-- A CRM with no owner cannot have one added, because adding one is the thing
-- only an owner may do. So this refuses to finish rather than leave that
-- state behind, and says which of the two ways it went wrong.
do $$
declare
  owner_email text := 'mirzahasecic97@gmail.com';
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(owner_email);

  if uid is null then
    raise exception
      'There is no account for %. Check the address in Authentication, Users.', owner_email;
  end if;

  -- An account can be on the staff list already or not; either way it ends up
  -- there as owner.
  insert into nql_staff (user_id, role) values (uid, 'owner')
  on conflict (user_id) do update set role = 'owner';

  if not exists (select 1 from nql_staff where role = 'owner') then
    raise exception 'No owner was set. Nothing has been changed.';
  end if;
end $$;


create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nql_staff where user_id = auth.uid() and role = 'owner'
  );
$$;

grant execute on function public.is_owner() to authenticated;


-- --------------------------------------------------------------------------
-- Who may change the lists
-- --------------------------------------------------------------------------

-- Everyone signed in as staff can see who their colleagues are. Only the
-- owner can change the list.
drop policy if exists "staff read nql_staff"  on nql_staff;
drop policy if exists "staff write nql_staff" on nql_staff;
create policy "staff read nql_staff"
  on nql_staff for select to authenticated using (public.is_nql_staff());
create policy "owner writes nql_staff"
  on nql_staff for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists "read partner users"        on partner_users;
drop policy if exists "staff write partner users" on partner_users;
create policy "read partner users"
  on partner_users for select to authenticated
  using (public.is_nql_staff() or user_id = auth.uid());
create policy "owner writes partner users"
  on partner_users for all to authenticated
  using (public.is_owner()) with check (public.is_owner());


-- --------------------------------------------------------------------------
-- What the control panel reads.
--
-- A view rather than the raw table, so the panel can show an email address
-- beside each person without opening auth.users to the whole team.
-- --------------------------------------------------------------------------

drop view if exists staff_admin;

create view staff_admin
with (security_barrier = true) as
  select ns.user_id,
         u.email,
         coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
         ns.role,
         ns.added_at
    from nql_staff ns
    join auth.users u on u.id = ns.user_id
   where public.is_nql_staff();

grant select on staff_admin to authenticated;


drop view if exists partner_users_admin;

create view partner_users_admin
with (security_barrier = true) as
  select pu.user_id,
         u.email,
         pu.name,
         pu.partner_id,
         p.name as agency,
         pu.status,
         pu.created_at
    from partner_users pu
    join auth.users u on u.id = pu.user_id
    join partners    p on p.id = pu.partner_id
   where public.is_nql_staff();

grant select on partner_users_admin to authenticated;


-- --------------------------------------------------------------------------
-- Every account, for the owner alone.
--
-- Without this the control panel cannot turn an email address into the id it
-- needs, and adding a colleague stays a hand written insert. Restricted to
-- the owner: the rest of the team has no reason to read a list of every
-- account on the project.
-- --------------------------------------------------------------------------

drop view if exists auth_accounts;

create view auth_accounts
with (security_barrier = true) as
  select u.id,
         u.email,
         u.created_at,
         u.last_sign_in_at,
         (ns.user_id is not null) as is_staff,
         (pu.user_id is not null) as is_agency
    from auth.users u
    left join nql_staff     ns on ns.user_id = u.id
    left join partner_users pu on pu.user_id = u.id
   where public.is_owner();

grant select on auth_accounts to authenticated;


select email, role from staff_admin order by role, email;
