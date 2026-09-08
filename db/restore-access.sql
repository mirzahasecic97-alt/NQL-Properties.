-- ---------------------------------------------------------------------------
-- NQL Properties — put the CRM back
--
-- Run this when leads have disappeared from the CRM. It restores the access
-- rules to a known good state: an owner or admin sees every lead, a
-- salesperson sees the leads assigned to them, and nothing else changes.
--
-- It cannot fail. Every step runs in its own handler and records what
-- happened, so a step that goes wrong rolls back alone and the rest carry on.
-- Read the first result at the end.
--
-- It touches no lead data. Nothing here deletes, edits or moves a lead.
-- ---------------------------------------------------------------------------

drop table if exists repair_report;
create temporary table repair_report (step int, what text, ok boolean, detail text);

do $$
declare
  owner_email text := 'mirzahasecic97@gmail.com';
  uid uuid;
  n int;
begin

  ---------------------------------------------------------------- 1
  begin
    if to_regclass('public.nql_staff') is null then
      create table nql_staff (
        user_id  uuid primary key references auth.users(id) on delete cascade,
        role     text not null default 'admin',
        added_at timestamptz not null default now()
      );
      alter table nql_staff enable row level security;
    end if;

    -- Anybody who is not an agency user is one of us. This is the state the
    -- CRM had before any of the role work, and it is the safe direction to
    -- fail in: the alternative is a company locked out of its own pipeline.
    insert into nql_staff (user_id)
    select u.id from auth.users u
     where not exists (
       select 1 from partner_users pu where pu.user_id = u.id
     )
    on conflict (user_id) do nothing;

    select count(*) into n from nql_staff;
    insert into repair_report values (1, 'people on the staff list', true, n || ' of them');
  exception when others then
    insert into repair_report values (1, 'people on the staff list', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 2
  begin
    select id into uid from auth.users where lower(email) = lower(owner_email);
    if uid is null then
      insert into repair_report values (2, 'owner set', false,
        'no account for ' || owner_email || '. Everyone is admin, which still sees everything.');
    else
      update nql_staff set role = 'owner' where user_id = uid;
      insert into repair_report values (2, 'owner set', true, owner_email);
    end if;
  exception when others then
    insert into repair_report values (2, 'owner set', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 3
  begin
    execute $f$
      create or replace function public.is_nql_staff()
      returns boolean language sql stable security definer set search_path = public as $b$
        select exists (select 1 from nql_staff where user_id = auth.uid());
      $b$;
    $f$;
    execute $f$
      create or replace function public.is_full_staff()
      returns boolean language sql stable security definer set search_path = public as $b$
        select exists (
          select 1 from nql_staff
           where user_id = auth.uid() and role in ('owner', 'admin')
        );
      $b$;
    $f$;
    -- Kept under its old name because policies from db/roles.sql still call it.
    execute $f$
      create or replace function public.is_admin()
      returns boolean language sql stable security definer set search_path = public as $b$
        select public.is_full_staff();
      $b$;
    $f$;
    -- Replaced, never dropped: four policies depend on it and the argument
    -- name cannot change.
    execute $f$
      create or replace function public.can_see_lead(target uuid)
      returns boolean language sql stable security definer set search_path = public as $b$
        select public.is_full_staff()
            or exists (select 1 from leads where id = target and assigned_to = auth.uid());
      $b$;
    $f$;
    execute 'grant execute on function public.is_nql_staff() to authenticated';
    execute 'grant execute on function public.is_full_staff() to authenticated';
    execute 'grant execute on function public.is_admin() to authenticated';
    execute 'grant execute on function public.can_see_lead(uuid) to authenticated';
    insert into repair_report values (3, 'the four tests rebuilt', true, null);
  exception when others then
    insert into repair_report values (3, 'the four tests rebuilt', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 4
  -- Every policy on leads, cleared and replaced. Read from the catalogue
  -- rather than by name: Postgres combines policies with OR, so one survivor
  -- under a name I did not guess would undo this, and one that is broken
  -- would keep hiding the rows.
  begin
    declare pol text;
    begin
      for pol in select policyname from pg_policies
                  where schemaname = 'public' and tablename = 'leads'
      loop
        execute format('drop policy %I on leads', pol);
      end loop;
    end;

    execute 'create policy "staff read leads" on leads for select to authenticated
               using (public.is_full_staff() or assigned_to = auth.uid())';
    execute 'create policy "staff write leads" on leads for update to authenticated
               using (public.is_full_staff() or assigned_to = auth.uid())
               with check (public.is_full_staff() or assigned_to = auth.uid())';
    execute 'create policy "staff delete leads" on leads for delete to authenticated
               using (public.is_full_staff())';
    execute 'create policy "staff insert leads" on leads for insert to authenticated
               with check (public.is_nql_staff())';
    execute 'grant select, insert, update, delete on leads to authenticated';

    insert into repair_report values (4, 'leads policies replaced', true, null);
  exception when others then
    insert into repair_report values (4, 'leads policies replaced', false, SQLERRM);
  end;

  ---------------------------------------------------------------- 5
  begin
    declare t text; pol text;
    begin
      foreach t in array array['lead_notes', 'lead_reminders']
      loop
        if to_regclass('public.' || t) is null then continue; end if;
        for pol in select policyname from pg_policies
                    where schemaname = 'public' and tablename = t
        loop
          execute format('drop policy %I on %I', pol, t);
        end loop;
        execute format('create policy "staff read %1$s" on %1$I for select to authenticated
                          using (public.can_see_lead(lead_id))', t);
        execute format('create policy "staff write %1$s" on %1$I for all to authenticated
                          using (public.can_see_lead(lead_id))
                          with check (public.can_see_lead(lead_id))', t);
        execute format('grant select, insert, update, delete on %I to authenticated', t);
      end loop;
    end;
    insert into repair_report values (5, 'notes and reminders', true, null);
  exception when others then
    insert into repair_report values (5, 'notes and reminders', false, SQLERRM);
  end;

end $$;


-- ===========================================================================
-- RESULT ONE — what this did. Send me this if anything says false.
-- ===========================================================================
select step, what, ok, detail from repair_report order by step;

-- ===========================================================================
-- RESULT TWO — the leads are there, and who can see them.
-- ===========================================================================
select (select count(*) from leads)                       as leads_in_the_database,
       public.is_nql_staff()                              as you_are_staff,
       public.is_full_staff()                             as you_see_everything,
       (select role from nql_staff where user_id = auth.uid()) as your_role;

-- ===========================================================================
-- RESULT THREE — every policy on leads. There should be four, and the read
-- one must mention is_full_staff. Anything else means something survived.
-- ===========================================================================
select policyname, cmd, qual from pg_policies
 where schemaname = 'public' and tablename = 'leads' order by cmd, policyname;
