-- ---------------------------------------------------------------------------
-- NQL Properties — a salesperson sees their own leads and nothing else
--
-- Three roles, all on nql_staff:
--
--   owner   everything, and can change who has access
--   admin   everything except that
--   sales   only the leads assigned to them, only the notes and reminders on
--           those leads, only their own tasks, and only the agencies they
--           look after. No newsletter, no introduction requests, no Control.
--
-- Enforced here, not in the interface. Hiding a tab while the API still
-- answers for it is not access control: anyone can open the browser console
-- and ask for the rows directly.
--
-- 'staff' was the old name for the third role and nobody holds it, since the
-- column defaults to admin. It becomes 'sales', which is what it means.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- Widen the constraint before renaming anything into it.
--
-- Found from the catalogue rather than by guessing its name: a check written
-- inline on add column is auto named, and dropping the wrong name silently
-- does nothing, which would leave the old constraint refusing 'sales' while
-- this file appeared to succeed.
do $$
declare
  c text;
begin
  if to_regclass('public.nql_staff') is null then
    raise exception 'nql_staff does not exist. Run db/owner-role.sql first.';
  end if;

  for c in
    select conname from pg_constraint
     where conrelid = 'public.nql_staff'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table nql_staff drop constraint %I', c);
  end loop;

  update nql_staff set role = 'sales' where role = 'staff';

  alter table nql_staff add constraint nql_staff_role_check
    check (role in ('owner', 'admin', 'sales'));
end $$;

comment on column nql_staff.role is
  'owner changes access. admin sees everything. sales sees only what is assigned to them.';


-- --------------------------------------------------------------------------
-- The two tests
-- --------------------------------------------------------------------------

create or replace function public.is_full_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nql_staff
     where user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

-- security definer so it can read leads without triggering leads' own policy,
-- which is the policy that calls it.
create or replace function public.can_see_lead(lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_full_staff()
      or exists (
        select 1 from leads where id = lead and assigned_to = auth.uid()
      );
$$;

grant execute on function public.is_full_staff()      to authenticated;
grant execute on function public.can_see_lead(uuid)   to authenticated;


-- --------------------------------------------------------------------------
-- Leads
--
-- No function call here: assigned_to is on the row being tested, so the
-- policy can read it directly and there is nothing to recurse into.
-- --------------------------------------------------------------------------

drop policy if exists "staff read leads"   on leads;
drop policy if exists "staff write leads"  on leads;
drop policy if exists "staff delete leads" on leads;
drop policy if exists "staff insert leads" on leads;

create policy "staff read leads"
  on leads for select to authenticated
  using (public.is_nql_staff() and (public.is_full_staff() or assigned_to = auth.uid()));

create policy "staff write leads"
  on leads for update to authenticated
  using (public.is_nql_staff() and (public.is_full_staff() or assigned_to = auth.uid()))
  with check (public.is_nql_staff() and (public.is_full_staff() or assigned_to = auth.uid()));

-- Deleting somebody else's lead is not a salesperson's decision.
create policy "staff delete leads"
  on leads for delete to authenticated using (public.is_full_staff());

create policy "staff insert leads"
  on leads for insert to authenticated with check (public.is_nql_staff());


-- --------------------------------------------------------------------------
-- What hangs off a lead
-- --------------------------------------------------------------------------

drop policy if exists "staff read notes"  on lead_notes;
drop policy if exists "staff write notes" on lead_notes;
create policy "staff read notes"
  on lead_notes for select to authenticated using (public.can_see_lead(lead_id));
create policy "staff write notes"
  on lead_notes for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));

drop policy if exists "staff read reminders"  on lead_reminders;
drop policy if exists "staff write reminders" on lead_reminders;
create policy "staff read reminders"
  on lead_reminders for select to authenticated using (public.can_see_lead(lead_id));
create policy "staff write reminders"
  on lead_reminders for all to authenticated
  using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id));

do $$
begin
  if to_regclass('public.lead_partners') is null then
    raise notice 'lead_partners does not exist, skipped.'; return;
  end if;
  execute 'drop policy if exists "staff manage lead partners" on lead_partners';
  execute 'create policy "staff manage lead partners" on lead_partners for all to authenticated
             using (public.can_see_lead(lead_id)) with check (public.can_see_lead(lead_id))';
end $$;


-- --------------------------------------------------------------------------
-- Tasks: their own, and the ones nobody has picked up
--
-- Unassigned tasks stay visible to everyone. A board where the unclaimed work
-- is invisible to the people who could claim it is worse than no board.
-- --------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.tasks') is null then return; end if;
  execute 'drop policy if exists "staff read tasks" on tasks';
  execute 'drop policy if exists "staff write tasks" on tasks';
  execute $p$create policy "staff read tasks" on tasks for select to authenticated
    using (public.is_full_staff() or assigned_to = auth.uid()
           or created_by = auth.uid() or assigned_to is null)$p$;
  execute $p$create policy "staff write tasks" on tasks for all to authenticated
    using (public.is_full_staff() or assigned_to = auth.uid() or created_by = auth.uid())
    with check (public.is_nql_staff())$p$;
end $$;


-- --------------------------------------------------------------------------
-- Agencies: the ones they look after
-- --------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.partners') is null then
    raise notice 'partners does not exist, skipped. Run db/partners.sql.'; return;
  end if;
  execute 'drop policy if exists "read partners" on partners';
  execute 'drop policy if exists "staff manage partners" on partners';
  execute 'create policy "read partners" on partners for select to authenticated
             using (public.is_full_staff() or id = public.my_partner_id()
                    or exists (select 1 from partner_staff ps
                                where ps.partner_id = partners.id and ps.user_id = auth.uid()))';
  execute 'create policy "staff manage partners" on partners for all to authenticated
             using (public.is_full_staff()) with check (public.is_full_staff())';
  execute 'drop policy if exists "staff manage partner contacts" on partner_contacts';
  execute 'create policy "staff manage partner contacts" on partner_contacts for all to authenticated
             using (public.is_full_staff()) with check (public.is_full_staff())';
end $$;


do $$
begin
  if to_regclass('public.partner_countries') is null then
    raise notice 'partner_countries does not exist, skipped. Run db/partner-countries.sql.'; return;
  end if;
  execute 'drop policy if exists "read partner countries" on partner_countries';
  execute 'drop policy if exists "staff write partner countries" on partner_countries';
  execute 'create policy "read partner countries" on partner_countries for select to authenticated
             using (public.is_nql_staff() or partner_id = public.my_partner_id())';
  execute 'create policy "staff write partner countries" on partner_countries for all to authenticated
             using (public.is_full_staff()) with check (public.is_full_staff())';
end $$;


-- --------------------------------------------------------------------------
-- Not theirs at all
-- --------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.partner_interest') is null then
    raise notice 'partner_interest does not exist, skipped. Run db/partner-portal.sql.'; return;
  end if;
  execute 'drop policy if exists "read interest" on partner_interest';
  execute 'drop policy if exists "staff decide" on partner_interest';
  execute 'create policy "read interest" on partner_interest for select to authenticated
             using (public.is_full_staff() or partner_id = public.my_partner_id())';
  execute 'create policy "staff decide" on partner_interest for all to authenticated
             using (public.is_full_staff()) with check (public.is_full_staff())';
end $$;

do $$
begin
  if to_regclass('public.subscribers') is null then return; end if;
  execute 'drop policy if exists "staff read subscribers"   on subscribers';
  execute 'drop policy if exists "staff update subscribers" on subscribers';
  execute 'drop policy if exists "staff delete subscribers" on subscribers';
  execute 'create policy "staff read subscribers" on subscribers for select to authenticated using (public.is_full_staff())';
  execute 'create policy "staff update subscribers" on subscribers for update to authenticated using (public.is_full_staff()) with check (public.is_full_staff())';
  execute 'create policy "staff delete subscribers" on subscribers for delete to authenticated using (public.is_full_staff())';
end $$;


-- --------------------------------------------------------------------------
-- Who is what, and what that means for them
-- --------------------------------------------------------------------------

-- Which tables actually ended up restricted. A security change that half
-- applies is the dangerous kind, so this is worth reading rather than
-- assuming: anything listed as "any signed in staff" is still wide open.
select tablename,
       count(*) as policies,
       case
         when bool_or(qual like '%is_full_staff%' or qual like '%can_see_lead%'
                      or qual like '%assigned_to = auth.uid()%')
           then 'restricted'
         when bool_or(qual = 'true') then 'OPEN TO ANY SIGNED IN ACCOUNT'
         else 'any signed in staff'
       end as who_can_read
  from pg_policies
 where schemaname = 'public'
   and tablename in ('leads','lead_notes','lead_reminders','lead_partners',
                     'tasks','subscribers','partners','partner_contacts',
                     'partner_countries','partner_interest')
 group by tablename
 order by tablename;

select u.email,
       ns.role,
       case ns.role
         when 'owner' then 'everything, and can change access'
         when 'admin' then 'everything'
         else 'only leads assigned to them'
       end as sees,
       (select count(*) from leads l where l.assigned_to = ns.user_id) as leads_assigned
  from nql_staff ns
  join auth.users u on u.id = ns.user_id
 order by ns.role, u.email;
