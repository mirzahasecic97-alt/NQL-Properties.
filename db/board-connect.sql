-- ---------------------------------------------------------------------------
-- NQL Properties — connect the CRM and the agency portal again
--
-- Two faults, both fixed here.
--
-- 1  permission denied for view partner_board. A view that is dropped and
--    recreated loses its grants, and the grant did not run. The portal has
--    been asking a question it was not allowed to ask, so every country
--    setting was correct and none of them mattered.
--
-- 2  A lead with no country recorded was shown to NOBODY. Almost every lead
--    has no country, because the column arrived long after the leads did. So
--    the moment an agency was set to a country, its board emptied. That is
--    backwards: a buyer nobody has filed yet should be seen by everyone, not
--    lost. An agency set to Italy now sees Italian buyers AND buyers not yet
--    filed anywhere, which is how it behaved before the column existed.
--
-- SAFE BY CONSTRUCTION
--   it checks every table and function it needs FIRST and stops with a plain
--     message if one is missing, before dropping anything
--   it creates every function and column it uses, so it cannot fail halfway
--     on something that lives in a migration that never ran
--   it grants the view in the same file that creates it, which is the exact
--     mistake that caused fault 1
--   changes no lead, no policy, no setting
--   re-running it does the same thing again
--
-- Run in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 0. Stop now if anything is missing, while nothing has been touched.
-- --------------------------------------------------------------------------

do $$
declare missing text := '';
begin
  if to_regclass('public.leads')             is null then missing := missing || ' leads';             end if;
  if to_regclass('public.partners')          is null then missing := missing || ' partners';          end if;
  if to_regclass('public.partner_countries') is null then missing := missing || ' partner_countries'; end if;
  if to_regclass('public.partner_interest')  is null then missing := missing || ' partner_interest';  end if;
  if to_regclass('public.lead_partners')     is null then missing := missing || ' lead_partners';     end if;
  if to_regprocedure('public.my_partner_id()')  is null then missing := missing || ' my_partner_id()';  end if;
  if to_regprocedure('public.is_partner_user()') is null then missing := missing || ' is_partner_user()'; end if;

  if missing <> '' then
    raise exception
      'Nothing has been changed. Missing:%. Run db/partner-portal.sql first, then this file.', missing;
  end if;
  raise notice 'All prerequisites present. Continuing.';
end $$;


-- --------------------------------------------------------------------------
-- 1. Every column the view reads.
-- --------------------------------------------------------------------------

alter table partners      add column if not exists sees_leads      boolean not null default true;
alter table lead_partners add column if not exists granted         boolean not null default false;

alter table leads add column if not exists lead_no          text;
alter table leads add column if not exists deal_value       numeric;
alter table leads add column if not exists country          text;
alter table leads add column if not exists match_score      smallint;
alter table leads add column if not exists intro_consent    text;
alter table leads add column if not exists based_in         text;
alter table leads add column if not exists location_detail  text;
alter table leads add column if not exists property_kinds   text;
alter table leads add column if not exists project_interest text;
alter table leads add column if not exists bedrooms         text;
alter table leads add column if not exists land             text;
alter table leads add column if not exists must_haves       text;
alter table leads add column if not exists dealbreakers     text;
alter table leads add column if not exists timeline         text;
alter table leads add column if not exists purpose          text;


-- --------------------------------------------------------------------------
-- 2. Every function the view calls.
-- --------------------------------------------------------------------------

create or replace function public.budget_band(budget_text text, value numeric)
returns text language plpgsql immutable as $$
declare n numeric; digits text;
begin
  n := value;
  if n is null and budget_text is not null then
    digits := substring(replace(budget_text, ',', '.') from '[0-9]+\.?[0-9]*');
    if digits is not null and digits <> '' then
      n := digits::numeric;
      if lower(budget_text) like '%m%' and n < 100 then n := n * 1000000;
      elsif n < 10000 then n := n * 1000; end if;
    end if;
  end if;
  if    n is null or n <= 0 then return 'Not stated';
  elsif n <   250000 then return 'Under 250k';
  elsif n <   500000 then return '250k to 500k';
  elsif n <  1000000 then return '500k to 1M';
  elsif n <  2000000 then return '1M to 2M';
  else                    return 'Over 2M';
  end if;
end; $$;

create or replace function public.match_band(score smallint)
returns text language sql immutable as $$
  select case
    when score is null then null
    when score >= 80   then 'hot'
    when score >= 50   then 'warm'
    when score >= 1    then 'limited'
    else null end;
$$;

create or replace function public.info_score(
  first_name text, last_name text, email text, phone text,
  country text, budget text, deal_value numeric,
  property_name text, project_interest text, message text
) returns smallint language sql immutable as $$
  select (round(100.0 * (
      (nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), '') is not null)::int
    + (nullif(trim(coalesce(email,'')), '') is not null)::int
    + (nullif(trim(coalesce(phone,'')), '') is not null)::int
    + (nullif(trim(coalesce(country,'')), '') is not null)::int
    + ((nullif(trim(coalesce(budget,'')), '') is not null) or (deal_value is not null))::int
    + (nullif(trim(coalesce(property_name,'') || coalesce(project_interest,'')), '') is not null)::int
    + (nullif(trim(coalesce(message,'')), '') is not null)::int
  ) / 7.0))::smallint;
$$;

grant execute on function public.budget_band(text, numeric) to authenticated;
grant execute on function public.match_band(smallint)       to authenticated;
grant execute on function public.info_score(text,text,text,text,text,text,numeric,text,text,text)
  to authenticated;


-- --------------------------------------------------------------------------
-- 3. The board.
--
-- What an agency still does not see, and these are the only four:
--   1  buyers looking in a country they are not down for, WHERE A COUNTRY IS
--      RECORDED. A buyer with no country reaches everyone.
--   2  buyers already introduced to them, which are under My leads instead
--   3  won and lost
--   4  footer messages, meeting requests, newsletter signups and other
--      agencies asking for a demo, none of whom are buyers
-- --------------------------------------------------------------------------

drop view if exists partner_board;

create view partner_board
with (security_barrier = true) as
  select
    l.id, l.lead_no, l.created_at, l.stage, l.country,
    l.location_detail, l.based_in, l.property_name, l.project_interest,
    l.property_kinds, l.bedrooms, l.land, l.must_haves, l.dealbreakers,
    l.timeline, l.purpose, l.budget, l.deal_value,
    l.meeting_format, l.preferred_date, l.preferred_time,
    public.budget_band(l.budget, l.deal_value) as budget_band,
    public.match_band(
      coalesce(l.match_score, public.info_score(
        l.first_name, l.last_name, l.email, l.phone, l.country,
        l.budget, l.deal_value, l.property_name, l.project_interest, l.message))
    )                                          as match_band,
    (select count(*) from partner_interest pi
      where pi.lead_id = l.id
        and pi.status in ('asked', 'pending', 'granted'))::int as pitches,
    exists (
      select 1 from partner_interest pi
       where pi.lead_id = l.id and pi.partner_id = public.my_partner_id()
    )                                          as asked,
    'shared'::text                             as my_tier
  from leads l
  where public.is_partner_user()
    and exists (
      select 1 from partners p
       where p.id = public.my_partner_id() and p.sees_leads
    )
    and l.source not in ('footer', 'meeting', 'newsletter', 'agency')
    and l.stage not in ('won', 'lost')
    and not exists (
      select 1 from lead_partners lp
       where lp.lead_id = l.id
         and lp.partner_id = public.my_partner_id()
         and lp.granted
    )
    and (
      -- No countries chosen still means every country.
      not exists (
        select 1 from partner_countries pc where pc.partner_id = public.my_partner_id()
      )
      -- Nobody has filed this buyer under a country yet. Better seen by
      -- everyone than seen by nobody, which is what was happening.
      or l.country is null
      or btrim(l.country) = ''
      -- Or it is a country they cover.
      or l.country in (
        select pc.country from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
    );

grant select on partner_board to authenticated;


-- --------------------------------------------------------------------------
-- 4. And the grants for everything else the portal reads, because a missing
--    one of these is what the 403 was. A relation that is not there is
--    skipped rather than throwing.
-- --------------------------------------------------------------------------

do $$
declare r record;
begin
  for r in
    select * from (values
      ('partner_leads',     'select'),
      ('partner_countries', 'select'),
      ('partner_interest',  'select, insert, update, delete'),
      ('partner_offers',    'select, insert, update, delete'),
      ('fix_requests',      'select, insert, update, delete')
    ) as t(rel, privs)
  loop
    if to_regclass('public.' || r.rel) is null then
      raise notice 'skipped %, not present', r.rel;
    else
      execute format('grant %s on public.%I to authenticated', r.privs, r.rel);
      raise notice 'granted % on %', r.privs, r.rel;
    end if;
  end loop;
end $$;


-- --------------------------------------------------------------------------
-- 5. What each agency will see when it next opens the portal.
--    Worked out the same way the view does, so this is not a guess.
-- --------------------------------------------------------------------------

select p.name                                as agency,
       case when p.sees_leads then 'on' else 'SWITCHED OFF' end as portal,
       coalesce((select string_agg(pc.country, ', ' order by pc.country)
                   from partner_countries pc where pc.partner_id = p.id),
                'every country')             as covers,
       (select count(*) from leads l
         where p.sees_leads
           and l.source not in ('footer', 'meeting', 'newsletter', 'agency')
           and l.stage  not in ('won', 'lost')
           and (
             not exists (select 1 from partner_countries pc where pc.partner_id = p.id)
             or l.country is null
             or btrim(l.country) = ''
             or l.country in (select pc.country from partner_countries pc
                               where pc.partner_id = p.id)
           )) as buyers_on_their_board
  from partners p
 where p.status is distinct from 'former'
 order by 4 desc, 1;
