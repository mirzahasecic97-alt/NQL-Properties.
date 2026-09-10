-- ---------------------------------------------------------------------------
-- NQL Properties — a country means a country
--
-- The board had a two day head start on it: an agency marked "shared" in Italy
-- saw Italian buyers only after forty eight hours, so switching Italy on did
-- not show Italy and there was no way to tell from the screen why.
--
-- That delay existed to make exclusivity worth selling. This business does not
-- sell exclusivity; it runs two or three agencies against each other on the
-- house they put forward. So the delay goes, and being in a country now means
-- seeing every live buyer looking there, at once.
--
-- The tier column stays, unused by this view. Nothing is dropped that would
-- have to be rebuilt if an exclusive arrangement is ever wanted again.
--
-- WHAT AN AGENCY STILL DOES NOT SEE, and these are the only four:
--
--   1  buyers looking in a country they are not down for
--   2  leads already introduced to them, which are under My leads instead
--   3  won and lost
--   4  meeting requests, newsletter signups and other
--      agencies asking for a demo, none of whom are buyers
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 0. Everything the view leans on, in case the file that adds it never ran.
--
-- This is the third time a board file has dropped the view and then failed to
-- create it because a column or a function lived in a different migration. A
-- file that drops something must be able to put it back on its own.
-- --------------------------------------------------------------------------

alter table partners add column if not exists sees_leads boolean not null default true;

alter table leads add column if not exists lead_no         text;
alter table leads add column if not exists deal_value      numeric;
alter table leads add column if not exists country         text;
alter table leads add column if not exists match_score     smallint;
alter table leads add column if not exists intro_consent   text;
alter table leads add column if not exists based_in        text;
alter table leads add column if not exists location_detail text;
alter table leads add column if not exists property_kinds  text;
alter table leads add column if not exists bedrooms        text;
alter table leads add column if not exists land            text;
alter table leads add column if not exists must_haves      text;
alter table leads add column if not exists dealbreakers    text;
alter table leads add column if not exists timeline        text;
alter table leads add column if not exists purpose         text;

alter table lead_partners add column if not exists granted boolean not null default false;

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

grant execute on function public.budget_band(text, numeric)          to authenticated;
grant execute on function public.match_band(smallint)                to authenticated;
grant execute on function public.info_score(text,text,text,text,text,text,numeric,text,text,text) to authenticated;


drop view if exists partner_board;

create view partner_board
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
    and exists (
      select 1 from partners p
       where p.id = public.my_partner_id() and p.sees_leads
    )
    and l.source not in ('meeting', 'newsletter', 'agency')
    and l.stage not in ('won', 'lost')
    and not exists (
      select 1 from lead_partners lp
       where lp.lead_id = l.id
         and lp.partner_id = public.my_partner_id()
         and lp.granted
    )
    and (
      -- No countries set at all still means every country.
      not exists (
        select 1 from partner_countries pc where pc.partner_id = public.my_partner_id()
      )
      -- Otherwise: in the country, see the country. No delay, no tier.
      or l.country in (
        select pc.country from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
    );

grant select on partner_board to authenticated;


-- --------------------------------------------------------------------------
-- What each agency would see now, and why the rest is missing.
-- --------------------------------------------------------------------------

select coalesce(l.country, 'no country set') as country,
       count(*) as live_buyers
  from leads l
 where l.source not in ('meeting', 'newsletter', 'agency')
   and l.stage not in ('won', 'lost')
 group by 1
 order by 2 desc;

select p.name as agency,
       case when not p.sees_leads then 'switched off' else
         coalesce(string_agg(pc.country, ', ' order by pc.country), 'every country')
       end as covers
  from partners p
  left join partner_countries pc on pc.partner_id = p.id
 group by p.name, p.sees_leads
 order by p.name;
