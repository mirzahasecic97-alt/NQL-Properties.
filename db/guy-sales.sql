-- ---------------------------------------------------------------------------
-- NQL Properties — restrict one person, and prove it
--
-- Small on purpose. Everything here is needed for a salesperson to stop
-- seeing other people's leads, and nothing here is anything else. If it
-- fails, the error is about one of six statements rather than about one of
-- two hundred.
--
-- Run the whole thing. It prints what it did at the end.
-- ---------------------------------------------------------------------------

-- 1. Let the role exist. A check written inline on `add column` is auto
--    named, so the old one is found in the catalogue rather than guessed at.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.nql_staff'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table nql_staff drop constraint %I', c);
  end loop;

  alter table nql_staff add constraint nql_staff_role_check
    check (role in ('owner', 'admin', 'sales'));
end $$;


-- 2. Who is on the sales team.
--
-- Matched on the email address OR the name shown in the CRM, because I do not
-- know their addresses and a guess that silently matches nobody is the worst
-- of the three outcomes. Anybody not found is named in a notice rather than
-- passed over.
--
-- Add or remove lines here. One name or address per line.
do $$
declare
  who text;
  hit int;
begin
  foreach who in array array[
    'Guy Smit',
    'NIZ'
  ]
  loop
    update nql_staff ns
       set role = 'sales'
      from auth.users u
     where u.id = ns.user_id
       and (
         lower(u.email) = lower(who)
         or lower(coalesce(u.raw_user_meta_data->>'name', '')) = lower(who)
         or lower(split_part(u.email, '@', 1)) = lower(replace(who, ' ', ''))
       );
    get diagnostics hit = row_count;

    if hit = 0 then
      raise notice 'No account matched "%". Check the spelling against the list printed at the end.', who;
    else
      raise notice '% is now sales.', who;
    end if;
  end loop;
end $$;


-- 3. The test the policy leans on. security definer so it can read the staff
--    list without tripping that table's own policy.
create or replace function public.is_full_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nql_staff
     where user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_full_staff() to authenticated;


-- 4. The leads themselves. Replaces, never joins: Postgres combines policies
--    with OR, so one surviving policy that says true would undo this one.
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

create policy "staff delete leads"
  on leads for delete to authenticated using (public.is_full_staff());

create policy "staff insert leads"
  on leads for insert to authenticated with check (public.is_nql_staff());


-- 5. Who is what now. If somebody who should be sales is still admin, their
--    name did not match: take the address from this list and put it in the
--    array above.
select u.email,
       coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
       ns.role,
       (select count(*) from leads l where l.assigned_to = ns.user_id) as leads_assigned
  from nql_staff ns join auth.users u on u.id = ns.user_id
 order by ns.role, u.email;

-- 6. Every policy that can read a lead. There should be exactly one, and its
--    expression must mention assigned_to. Anything saying `true` here means
--    an older policy survived and everyone still sees everything.
select policyname, cmd, qual
  from pg_policies
 where schemaname = 'public' and tablename = 'leads' and cmd in ('SELECT', 'ALL')
 order by policyname;
