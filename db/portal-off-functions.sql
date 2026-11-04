-- The agency portal went on 30 Oct 2026 (portal-off.sql) and partner_users
-- with it. Two helpers still read that table, and the row-level rules on
-- partners, partner_contacts and lead_partners call them, so loading the
-- partners failed with: relation "partner_users" does not exist.
-- With no agency logins left, nobody is an agency user: the helpers say so
-- without touching the table. Run in the Supabase SQL editor. Safe to run twice.

create or replace function public.is_partner_user()
returns boolean language sql stable security definer set search_path = public as $$
  select false
$$;

create or replace function public.my_partner_id()
returns uuid language sql stable security definer set search_path = public as $$
  select null::uuid
$$;

-- Anything else still pointing at the old table shows up here; expect no rows.
select n.nspname as schema, p.proname as function
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where p.prosrc ilike '%partner_users%'
   and n.nspname not in ('pg_catalog', 'information_schema');
