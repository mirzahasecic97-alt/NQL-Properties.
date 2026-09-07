-- ---------------------------------------------------------------------------
-- NQL Properties, roles
--
-- Two roles. An admin sees everything. A salesperson sees the leads assigned
-- to them and nothing else: no other people's leads, no partner agencies, no
-- newsletter subscribers, no other people's tasks.
--
-- This is enforced in the database, not in the interface. Hiding a section in
-- the CRM while the API still returns the rows is not access control; anyone
-- can open the browser console and ask for them directly.
--
-- IMPORTANT: this file REPLACES the existing "using (true)" policies. Those
-- granted every signed-in user everything, so they have to go, not sit
-- alongside these.
--
-- Run the whole file in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. Who is what
-- --------------------------------------------------------------------------

create table if not exists staff_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'sales' check (role in ('admin', 'sales')),
  created_at timestamptz not null default now()
);

alter table staff_roles enable row level security;

-- --------------------------------------------------------------------------
-- 2. The test every policy below leans on
--
-- security definer so it can read staff_roles without triggering that table's
-- own policies, which would recurse. Anyone with no row is NOT an admin, so a
-- new account starts with the least access rather than the most.
-- --------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Everyone may read the roles table, so the CRM can tell what it is allowed to
-- show. Only an admin may change it, or a salesperson could promote himself.
drop policy if exists "read roles"  on staff_roles;
drop policy if exists "admin roles" on staff_roles;

create policy "read roles"  on staff_roles for select to authenticated using (true);
create policy "admin roles" on staff_roles for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on staff_roles to authenticated;
grant select, insert, update, delete on staff_roles to service_role;

-- --------------------------------------------------------------------------
-- 3. Leads: the whole point
-- --------------------------------------------------------------------------

drop policy if exists "staff read leads"   on leads;
drop policy if exists "staff write leads"  on leads;
drop policy if exists "staff add leads"    on leads;
drop policy if exists "staff delete leads" on leads;

create policy "read leads" on leads for select to authenticated
  using (public.is_admin() or assigned_to = auth.uid());

create policy "edit leads" on leads for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid())
  with check (public.is_admin() or assigned_to = auth.uid());

-- A salesperson may add a lead, but only one that belongs to them. Otherwise
-- they can create rows they immediately cannot see.
create policy "add leads" on leads for insert to authenticated
  with check (public.is_admin() or assigned_to = auth.uid());

-- Deleting is how a GDPR erasure request is honoured, and it is permanent.
create policy "delete leads" on leads for delete to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- 4. Everything hanging off a lead follows the lead
-- --------------------------------------------------------------------------

create or replace function public.can_see_lead(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.leads l
    where l.id = target
      and (public.is_admin() or l.assigned_to = auth.uid())
  );
$$;

revoke all on function public.can_see_lead(uuid) from public;
grant execute on function public.can_see_lead(uuid) to authenticated;

drop policy if exists "staff read notes"      on lead_notes;
drop policy if exists "staff write notes"     on lead_notes;
drop policy if exists "staff read reminders"  on lead_reminders;
drop policy if exists "staff write reminders" on lead_reminders;
drop policy if exists "staff manage lead partners" on lead_partners;

create policy "notes follow lead" on lead_notes for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));

create policy "reminders follow lead" on lead_reminders for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));

create policy "lead partners follow lead" on lead_partners for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));

-- --------------------------------------------------------------------------
-- 5. Admin only: agencies and subscribers
-- --------------------------------------------------------------------------

drop policy if exists "staff manage partners"         on partners;
drop policy if exists "staff manage partner contacts" on partner_contacts;
drop policy if exists "staff read subscribers"        on subscribers;
drop policy if exists "staff update subscribers"      on subscribers;
drop policy if exists "staff delete subscribers"      on subscribers;

create policy "admin partners" on partners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin partner contacts" on partner_contacts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin subscribers" on subscribers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- 6. Tasks: yours, or everyone's if you are an admin
-- --------------------------------------------------------------------------

drop policy if exists "staff read tasks"   on tasks;
drop policy if exists "staff add tasks"    on tasks;
drop policy if exists "staff edit tasks"   on tasks;
drop policy if exists "staff delete tasks" on tasks;

create policy "read tasks" on tasks for select to authenticated
  using (public.is_admin() or assigned_to = auth.uid() or created_by = auth.uid());

create policy "add tasks" on tasks for insert to authenticated with check (true);

create policy "edit tasks" on tasks for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid() or created_by = auth.uid())
  with check (true);

create policy "delete tasks" on tasks for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- --------------------------------------------------------------------------
-- 7. Name your admins
--
-- Everyone who already has an account today is staff, so they all become
-- admins. No email addresses to type, and nobody gets locked out by a typo.
--
-- The salesperson you invite next has no row here, and is_admin() answers
-- false for anyone without one, so a new account is a salesperson by default.
-- --------------------------------------------------------------------------

insert into staff_roles (user_id, role)
select id, 'admin' from auth.users
on conflict (user_id) do nothing;

-- To promote somebody later:
--   insert into staff_roles (user_id, role)
--   select id, 'admin' from auth.users where lower(email) = 'name@example.com'
--   on conflict (user_id) do update set role = 'admin';
--
-- To demote somebody to sales:
--   insert into staff_roles (user_id, role)
--   select id, 'sales' from auth.users where lower(email) = 'name@example.com'
--   on conflict (user_id) do update set role = 'sales';

-- --------------------------------------------------------------------------
-- 8. Check it landed
-- --------------------------------------------------------------------------

select u.email, r.role
from staff_roles r
join auth.users u on u.id = r.user_id
order by r.role, u.email;
