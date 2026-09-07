-- ---------------------------------------------------------------------------
-- NQL Properties — keeping the promise in the privacy policy
--
-- The policy says, in writing, to anyone who reads it:
--
--   An enquiry that goes nowhere    Two years from your last contact with us
--   An enquiry that becomes a purchase  Ten years, as accounting and
--                                       anti-money-laundering law requires
--   Record that you unsubscribed    Three years
--
-- Nothing was enforcing any of it. Every enquiry ever received was still
-- there, along with the complete form payload in `raw`. That is a written
-- commitment to Datatilsynet that the database was not keeping.
--
-- This adds the job that keeps it. It runs nightly and deletes rather than
-- anonymises, because the policy says kept for, not kept in a reduced form.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------



-- --------------------------------------------------------------------------
-- What counts as "your last contact with us"
--
-- The later of: when they wrote in, when we last touched the record, and when
-- anyone last wrote a note on it. A lead somebody rang last month is not two
-- years old however long ago the form arrived.
-- --------------------------------------------------------------------------

create or replace function public.last_contact(l leads)
returns timestamptz language sql stable as $$
  select greatest(
    l.created_at,
    l.updated_at,
    coalesce((select max(created_at) from lead_notes n where n.lead_id = l.id), l.created_at)
  );
$$;


create or replace function public.apply_retention()
returns table (what text, removed bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  n_dead  bigint;
  n_old   bigint;
  n_subs  bigint;
  n_raw   bigint;
begin
  -- Enquiries that went nowhere, two years after the last contact. A lead
  -- that became a purchase is kept: 'won' is the accounting record, and the
  -- law that requires it beats the promise to delete.
  with gone as (
    delete from leads l
     where l.stage <> 'won'
       and public.last_contact(l) < now() - interval '2 years'
    returning 1
  )
  select count(*) into n_dead from gone;

  -- Ten years for the ones that completed, then they go too.
  with old_sales as (
    delete from leads l
     where l.stage = 'won'
       and public.last_contact(l) < now() - interval '10 years'
    returning 1
  )
  select count(*) into n_old from old_sales;

  -- The record that somebody unsubscribed is kept for three years, because it
  -- is what proves when they opted out. After that it is just an old address.
  with gone_subs as (
    delete from subscribers
     where unsubscribed_at is not null
       and unsubscribed_at < now() - interval '3 years'
    returning 1
  )
  select count(*) into n_subs from gone_subs;

  -- The full form payload is only ever needed while an enquiry is live: it is
  -- the fallback for a field that failed to map. After a year the typed
  -- columns are the record, and keeping a second copy of somebody's details
  -- for no reason is exactly what data minimisation forbids.
  update leads
     set raw = '{}'::jsonb
   where raw <> '{}'::jsonb
     and created_at < now() - interval '1 year';
  get diagnostics n_raw = row_count;

  return query
    select 'enquiries deleted, went nowhere'::text, n_dead
    union all select 'enquiries deleted, completed over ten years ago', n_old
    union all select 'unsubscribe records deleted', n_subs
    union all select 'payloads cleared', n_raw;
end;
$$;

revoke all on function public.apply_retention() from public, anon, authenticated;


-- --------------------------------------------------------------------------
-- Nightly, at 03:15 UTC.
--
-- pg_cron has to be switched on first: Supabase dashboard, Database,
-- Extensions, search for pg_cron, enable. It cannot be created from here
-- because the SQL editor is not superuser.
--
-- If it is not on, this block does nothing and says so. The function above is
-- already installed either way, so you can run it by hand:
--
--   select * from public.apply_retention();
--
-- and the policy is being kept the moment you do. The schedule only decides
-- whether somebody has to remember.
-- --------------------------------------------------------------------------

do $$
begin
  if to_regnamespace('cron') is null then
    raise notice 'pg_cron is not enabled, so nothing was scheduled. Enable it under Database, Extensions, then run this file again. Until then run: select * from public.apply_retention();';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'nql-retention') then
    perform cron.unschedule('nql-retention');
  end if;

  perform cron.schedule('nql-retention', '15 3 * * *', 'select public.apply_retention()');
  raise notice 'Scheduled nightly at 03:15 UTC.';
end $$;


-- --------------------------------------------------------------------------
-- So the CRM can say whether this was ever run.
--
-- The Control panel checks every other feature by asking for a column. A
-- promise cannot be checked that way, so this reports the answer instead.
-- --------------------------------------------------------------------------

create or replace view retention_status
with (security_barrier = true) as
  select
    (to_regprocedure('public.apply_retention()') is not null) as installed,
    (to_regnamespace('cron') is not null)                     as cron_available
  where public.is_nql_staff();

grant select on retention_status to authenticated;


-- --------------------------------------------------------------------------
-- What would go if it ran right now. Read this before trusting the job.
-- --------------------------------------------------------------------------

select 'would delete, went nowhere' as what, count(*)
  from leads l
 where l.stage <> 'won' and public.last_contact(l) < now() - interval '2 years'
union all
select 'would delete, completed over ten years ago', count(*)
  from leads l
 where l.stage = 'won' and public.last_contact(l) < now() - interval '10 years'
union all
select 'payloads that would be cleared', count(*)
  from leads where raw <> '{}'::jsonb and created_at < now() - interval '1 year'
union all
select 'oldest enquiry we hold', extract(year from min(created_at))::bigint from leads;
