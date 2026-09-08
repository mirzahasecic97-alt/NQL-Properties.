-- ---------------------------------------------------------------------------
-- NQL Properties — repair the roles left behind by db/roles.sql
--
-- THE ERROR, AND WHAT IT REVEALED
--
-- Dropping can_see_lead failed because four policies depend on it. Those
-- policies were created by db/roles.sql weeks ago, and they are still in
-- force: "notes follow lead", "reminders follow lead", "lead partners follow
-- lead". So notes and reminders were already restricted, and had been all
-- along, by a function nobody had looked at since.
--
-- That function asks is_admin(), which reads staff_roles. Nothing has written
-- to staff_roles since the admin and sales split was reverted; roles live in
-- nql_staff now. So is_admin() returns false for EVERYBODY, the owner
-- included, and can_see_lead() has been answering "only leads assigned to
-- you" for every single person in the company.
--
-- Which is very likely why the reminder count would not clear: the CRM works
-- out whether a lead has been contacted from the newest note on it, and if
-- Jon rings a lead assigned to himself, that note is invisible to everyone
-- else. Nothing was wrong with the counting. The notes were being hidden.
--
-- THE FIX
--
-- Do not drop the function. Replace its body, keeping the argument name
-- `target` that db/roles.sql gave it, and all four policies start behaving
-- correctly the moment it changes. Nothing is dropped, so nothing can fail
-- on a dependency.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. Read roles from the table that is actually maintained
--
-- is_admin kept under its old name because policies from db/roles.sql call
-- it. is_full_staff is the name the newer files use. One body, two names, so
-- they cannot disagree.
-- --------------------------------------------------------------------------

create or replace function public.is_full_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.nql_staff
     where user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_full_staff();
$$;


-- --------------------------------------------------------------------------
-- 2. The lead test itself
--
-- The argument stays `target`. create or replace cannot rename an argument,
-- and dropping is what failed: four policies depend on this.
--
-- The old body required the lead row to exist AND the person to be an admin,
-- so an admin could not see a note whose lead had been deleted. This one
-- answers on the role first.
-- --------------------------------------------------------------------------

create or replace function public.can_see_lead(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_full_staff()
      or exists (
        select 1 from public.leads
         where id = target and assigned_to = auth.uid()
      );
$$;

grant execute on function public.is_full_staff()    to authenticated;
grant execute on function public.is_admin()         to authenticated;
grant execute on function public.can_see_lead(uuid) to authenticated;


-- --------------------------------------------------------------------------
-- 3. What this now means for each person
--
-- Everyone on nql_staff with role owner or admin should read TRUE. Anybody
-- reading FALSE sees only what is assigned to them, which is right for sales
-- and wrong for anybody else.
-- --------------------------------------------------------------------------

select u.email,
       ns.role,
       case when ns.role in ('owner', 'admin')
            then 'sees every lead, note and reminder'
            else 'sees only what is assigned to them' end as effect
  from public.nql_staff ns
  join auth.users u on u.id = ns.user_id
 order by ns.role, u.email;


-- Every policy that leans on this function, so it is clear what just changed.
select tablename, policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and qual like '%can_see_lead%'
 order by tablename, policyname;
