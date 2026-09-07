-- ---------------------------------------------------------------------------
-- NQL Properties — what is actually in the database
--
-- Read only. Changes nothing, cannot fail on a missing table, and answers
-- every question I would otherwise be guessing at.
--
-- Run the whole thing and send back all six results.
-- ---------------------------------------------------------------------------

-- 1. Which of our tables and views exist.
select 'tables and views' as report, * from (
  select name,
         case when to_regclass('public.' || name) is null then 'MISSING' else 'present' end as state
    from (values
      ('leads'), ('lead_notes'), ('lead_reminders'), ('lead_stages'),
      ('nql_staff'), ('partner_users'), ('partner_interest'),
      ('partners'), ('partner_contacts'), ('partner_staff'), ('partner_countries'),
      ('lead_partners'), ('tasks'), ('subscribers'), ('presence'),
      ('partner_board'), ('partner_leads'), ('staff'), ('staff_admin'),
      ('auth_accounts'), ('retention_status')
    ) as t(name)
) x order by state, name;

-- 2. Which of our functions exist.
select 'functions' as report, * from (
  select sig,
         case when to_regprocedure(sig) is null then 'MISSING' else 'present' end as state
    from (values
      ('public.is_nql_staff()'), ('public.is_partner_user()'), ('public.my_partner_id()'),
      ('public.is_owner()'), ('public.is_full_staff()'), ('public.can_see_lead(uuid)'),
      ('public.budget_band(text,numeric)'), ('public.match_band(smallint)'),
      ('public.info_score(text,text,text,text,text,text,numeric,text,text,text)'),
      ('public.apply_retention()'), ('public.set_lead_no()')
    ) as t(sig)
) x order by state, sig;

-- 3. The columns on nql_staff, and the constraint on role.
select 'nql_staff columns' as report, column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'nql_staff'
 order by ordinal_position;

select 'role constraints' as report, conname, pg_get_constraintdef(oid) as definition
  from pg_constraint
 where conrelid = to_regclass('public.nql_staff') and contype = 'c';

-- 4. Who is on the staff list and as what.
select 'staff' as report, u.email, ns.role
  from nql_staff ns join auth.users u on u.id = ns.user_id
 order by ns.role, u.email;

-- 5. Every policy on the tables that matter, and what it actually tests.
--    This is the one that says whether the restriction is in place.
select 'policies' as report, tablename, policyname, cmd, qual
  from pg_policies
 where schemaname = 'public'
   and tablename in ('leads','lead_notes','lead_reminders','tasks',
                     'subscribers','partners','partner_interest')
 order by tablename, cmd, policyname;

-- 6. The server, in case something here needs a version I have assumed.
select 'version' as report, version();
