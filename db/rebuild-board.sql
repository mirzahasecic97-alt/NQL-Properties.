-- ---------------------------------------------------------------------------
-- NQL Properties — rebuild the agency board, from nothing
--
-- WHY THIS EXISTS
--
-- Several files drop partner_board and create it again. Each one leans on
-- functions created in a different file, and none of them said so. If any of
-- those functions was missing, the drop succeeded and the create failed, and
-- the portal was left with no board at all: the agency signs in and the board
-- will not load.
--
-- This file needs nothing. It creates every function the view uses, then the
-- view, in order. Run it any time the portal's board is broken and it will be
-- whole again.
--
-- Safe to re-run. Nothing here touches a lead.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. Columns the view reads, in case a migration that adds them never ran
-- --------------------------------------------------------------------------

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

alter table lead_partners add column if not exists granted    boolean not null default false;
alter table lead_partners add column if not exists granted_at timestamptz;
alter table lead_partners add column if not exists outcome    text;
alter table lead_partners add column if not exists outcome_at timestamptz;
alter table lead_partners add column if not exists outcome_note text;

alter table partner_countries add column if not exists tier text
  not null default 'shared';


-- --------------------------------------------------------------------------
-- 2. Every function the view calls
-- --------------------------------------------------------------------------

create or replace function public.head_start()
returns interval language sql immutable as $$ select interval '48 hours'; $$;

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

grant execute on function public.head_start()      to authenticated;
grant execute on function public.budget_band(text, numeric) to authenticated;
grant execute on function public.match_band(smallint)       to authenticated;
grant execute on function public.info_score(text,text,text,text,text,text,numeric,text,text,text) to authenticated;


-- --------------------------------------------------------------------------
-- 3. The board itself
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
    coalesce(
      (select pc.tier from partner_countries pc
        where pc.partner_id = public.my_partner_id() and pc.country = l.country),
      'shared'
    )                                          as my_tier
  from leads l
  where public.is_partner_user()
    and l.source not in ('footer', 'meeting', 'newsletter')
    and l.stage not in ('won', 'lost')
    and not exists (
      select 1 from lead_partners lp
       where lp.lead_id = l.id
         and lp.partner_id = public.my_partner_id()
         and lp.granted
    )
    and (
      not exists (
        select 1 from partner_countries pc where pc.partner_id = public.my_partner_id()
      )
      or exists (
        select 1 from partner_countries pc
         where pc.partner_id = public.my_partner_id()
           and pc.country = l.country
           and (
             pc.tier = 'exclusive'
             or (pc.tier = 'shared' and l.created_at < now() - public.head_start())
           )
      )
    );

grant select on partner_board to authenticated;


drop view if exists partner_leads;

create view partner_leads
with (security_barrier = true) as
  select
    l.id, l.lead_no, l.created_at, l.stage, l.country,
    l.first_name, l.last_name, l.email, l.phone,
    l.budget, l.deal_value, l.message, l.property_name, l.project_interest,
    l.location_detail, l.property_kinds, l.bedrooms, l.land,
    l.must_haves, l.dealbreakers, l.purpose, l.timeline,
    lp.granted_at as intro_consent_at,
    lp.outcome, lp.outcome_at, lp.outcome_note
  from leads l
  join lead_partners lp on lp.lead_id = l.id
  where public.is_partner_user()
    and lp.partner_id = public.my_partner_id()
    and lp.granted;

grant select on partner_leads to authenticated;


-- Both views exist and answer. Zero rows for you is correct: you are not an
-- agency. What matters is that neither line errors.
select 'partner_board' as view, count(*) from partner_board
union all
select 'partner_leads', count(*) from partner_leads;
