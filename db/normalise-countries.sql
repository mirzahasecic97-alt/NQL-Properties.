-- ---------------------------------------------------------------------------
-- NQL Properties — one spelling per country, and a way to say "none"
--
-- Evergreen Group is down for both "North Cyprus" and "Northern Cyprus". They
-- are the same place, and a lead labelled one of them does not match an agency
-- set to the other, so briefs go missing without anything looking wrong.
--
-- The stray spellings came from partners.country, which is free text and was
-- seeded into partner_countries as written.
--
-- Also adds an explicit way to show an agency nothing. Until now an agency
-- with no countries saw EVERY country, so there was no way to pause one
-- without deleting what it covers and forgetting it.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. One spelling
-- --------------------------------------------------------------------------

create or replace function public.tidy_country(c text)
returns text language sql immutable as $$
  select case
    when c is null or trim(c) = '' then null
    -- One Cyprus. The north of the island is where the Habitat project is,
    -- and the pages say so, but as a country to file a buyer under there is
    -- one Cyprus and splitting it only lost leads.
    when lower(trim(c)) in ('north cyprus', 'n cyprus', 'trnc', 'northern cyprus',
                            'north-cyprus', 'kktc', 'south cyprus', 'cyprus')
      then 'Cyprus'
    when lower(trim(c)) in ('italy', 'italia', 'it')            then 'Italy'
    when lower(trim(c)) in ('spain', 'espana', 'españa')        then 'Spain'
    when lower(trim(c)) in ('portugal')                         then 'Portugal'
    when lower(trim(c)) in ('france')                           then 'France'
    when lower(trim(c)) in ('greece')                           then 'Greece'
    when lower(trim(c)) in ('malta')                            then 'Malta'
    when lower(trim(c)) in ('croatia', 'hrvatska')              then 'Croatia'
    when lower(trim(c)) in ('montenegro', 'crna gora')          then 'Montenegro'
    when lower(trim(c)) in ('turkey', 'turkiye', 'türkiye')     then 'Turkey'
    when lower(trim(c)) in ('morocco', 'maroc')                 then 'Morocco'
    else initcap(trim(c))
  end;
$$;

-- Agencies first, or the merge below has nothing consistent to merge onto.
update partners
   set country = public.tidy_country(country)
 where country is distinct from public.tidy_country(country);

update leads
   set country = public.tidy_country(country)
 where country is not null
   and country is distinct from public.tidy_country(country);

-- An agency down for both spellings ends up with one row, not two. The
-- duplicate is dropped rather than renamed, because renaming it would collide
-- with the row that is already correct.
delete from partner_countries a
 using partner_countries b
 where a.partner_id = b.partner_id
   and public.tidy_country(a.country) = public.tidy_country(b.country)
   and a.ctid > b.ctid;

update partner_countries
   set country = public.tidy_country(country)
 where country is distinct from public.tidy_country(country);


-- --------------------------------------------------------------------------
-- 2. Showing an agency nothing
--
-- A separate column rather than an absence of rows, because "no countries
-- chosen" already means "every country" and one field cannot mean both. This
-- is how an agency is paused without losing the record of what it covers.
-- --------------------------------------------------------------------------

alter table partners add column if not exists sees_leads boolean not null default true;

comment on column partners.sees_leads is
  'False shows this agency an empty board while keeping the countries it covers on file.';


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
    coalesce(
      (select pc.tier from partner_countries pc
        where pc.partner_id = public.my_partner_id() and pc.country = l.country),
      'shared'
    )                                          as my_tier
  from leads l
  where public.is_partner_user()
    -- Switched off, and told so by the portal rather than left wondering.
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


-- --------------------------------------------------------------------------
-- 3. What is left
-- --------------------------------------------------------------------------

select p.name as agency,
       case when p.sees_leads then 'on' else 'SEES NOTHING' end as portal,
       coalesce(string_agg(pc.country, ', ' order by pc.country), 'every country') as covers
  from partners p
  left join partner_countries pc on pc.partner_id = p.id
 group by p.name, p.sees_leads
 order by p.name;

-- Any spelling still outside the twelve we offer. Should be empty.
select distinct country as unrecognised
  from (select country from leads where country is not null
        union select country from partner_countries) x
 where country not in ('Italy','Spain','Portugal','France','Greece','Cyprus',
                       'Malta','Croatia','Montenegro','Turkey','Morocco');
