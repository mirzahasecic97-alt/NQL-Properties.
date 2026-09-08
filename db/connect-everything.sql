-- ---------------------------------------------------------------------------
-- NQL Properties — leads in the portal, controlled from the control panel
--
-- One file, run once. It does the whole chain:
--
--   1  adds every column and function the board needs
--   2  gives each lead the country it is plainly about, read from the property
--      it asked about, the project, the page and what the buyer wrote
--   3  turns the agency switch on where it was never set. null is not true in
--      Postgres, so an unset switch closed the board while the control panel
--      showed the agency as fine
--   4  rebuilds the board with a strict country match: Italy means Italy
--   5  grants it, which is the step that was missing and caused
--      "permission denied for view partner_board"
--   6  prints how many buyers each agency will see
--
-- WHY THIS ONE CANNOT LEAVE YOU WORSE OFF
--
-- The new board is built beside the old one under a temporary name. Only once
-- it has compiled is the old one dropped and the new one renamed into place.
-- If anything in it is wrong, the create fails and the board you have now is
-- untouched. Every earlier file dropped first and created second, which is how
-- the portal ended up with no board at all.
--
-- Nothing is deleted. No policy changes. No setting you made is overwritten.
--
-- Run in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

-- ==========================================================================
-- 1. Columns and tables. Anything already there is left exactly as it is.
-- ==========================================================================

create table if not exists partner_countries (
  partner_id uuid not null references partners(id) on delete cascade,
  country    text not null,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id) on delete set null,
  primary key (partner_id, country)
);

create table if not exists lead_partners (
  lead_id     uuid not null references leads(id)    on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  role        text,
  added_at    timestamptz not null default now(),
  added_by    uuid references auth.users(id) on delete set null,
  primary key (lead_id, partner_id)
);

grant select, insert, update, delete on partner_countries to authenticated;

alter table partners      add column if not exists sees_leads boolean not null default true;
alter table lead_partners add column if not exists granted    boolean not null default false;

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


-- ==========================================================================
-- 2. Give every lead its country.
--
-- Only where it is blank, so anything set by hand stays. Cyprus is read first
-- because the Habitat project is there and names it in ways Italy never does.
-- Word starts are marked with \m so "capital" is not read as Italy.
-- ==========================================================================

update leads set country = 'Cyprus'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ 'cyprus|habitat|kyrenia|girne|esentepe|iskele|famagusta|lp-cyprus';

update leads set country = 'Italy'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ '\mital|tuscan|toscana|umbria|sicil|puglia|apulia|marche|liguria|assisi|cortona|siena|florence|firenze|perugia|arezzo|grosseto|chianti|maremma|lucca|\mpisa|\mtodi|montepulciano|volterra|scarlino|ispica|vasanello|mugello|lp-italy';

update leads set country = 'Spain'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ '\mspain|\mespa|andaluc|marbella|mallorca|ibiza|costa del sol|alicante';

update leads set country = 'Portugal'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ 'portugal|algarve|lisbon|lisboa|cascais';

update leads set country = 'France'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ '\mfrance|\mfrench|provence|riviera|antibes|cannes';

update leads set country = 'Greece'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ 'greece|greek|crete|corfu|santorini|mykonos';


-- ==========================================================================
-- 3. An unset switch is not an off switch.
-- ==========================================================================

update partners set sees_leads = true where sees_leads is null;


-- ==========================================================================
-- 4. Functions the board calls.
-- ==========================================================================

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


-- ==========================================================================
-- 5. The board, built beside the old one first.
--
-- If anything below is wrong the create fails here and the board you have
-- keeps working. Only a board that compiled gets sworn in.
-- ==========================================================================

drop view if exists partner_board_new;

create view partner_board_new
with (security_barrier = true, security_invoker = false) as
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
    -- The switch, read as Postgres reads it. Unset was fixed in step 3.
    and coalesce((select p.sees_leads from partners p
                   where p.id = public.my_partner_id()), false)
    -- Buyers only.
    and l.source not in ('footer', 'meeting', 'newsletter', 'agency')
    and l.stage  not in ('won', 'lost')
    -- Not one already introduced to them; those live under My leads.
    and not exists (
      select 1 from lead_partners lp
       where lp.lead_id = l.id
         and lp.partner_id = public.my_partner_id()
         and lp.granted
    )
    -- The control panel decides this line. No countries chosen means every
    -- country. Choose Italy and Italy is what they get, nothing else.
    and (
      not exists (
        select 1 from partner_countries pc where pc.partner_id = public.my_partner_id()
      )
      or l.country in (
        select pc.country from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
    );

-- It compiled. Swap it in.
drop view if exists partner_board;
alter view partner_board_new rename to partner_board;

grant select on partner_board to authenticated;


-- ==========================================================================
-- 6. Everything else the portal reads, in case one of these lost its grant
--    the same way the board did. Missing ones are skipped, not thrown.
-- ==========================================================================

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
    end if;
  end loop;
end $$;


-- ==========================================================================
-- 7. What each agency will see when it opens the portal.
-- ==========================================================================

select p.name                                                     as agency,
       case when p.sees_leads then 'on' else 'SWITCHED OFF' end   as portal,
       coalesce((select string_agg(pc.country, ', ' order by pc.country)
                   from partner_countries pc where pc.partner_id = p.id),
                'every country')                                  as covers,
       (select count(*) from leads l
         where p.sees_leads
           and l.source not in ('footer', 'meeting', 'newsletter', 'agency')
           and l.stage  not in ('won', 'lost')
           and (
             not exists (select 1 from partner_countries pc where pc.partner_id = p.id)
             or l.country in (select pc.country from partner_countries pc
                               where pc.partner_id = p.id)
           ))                                                     as buyers_they_see
  from partners p
 where p.status is distinct from 'former'
 order by 4 desc, 1;
