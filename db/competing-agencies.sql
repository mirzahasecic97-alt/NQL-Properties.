-- ---------------------------------------------------------------------------
-- NQL Properties — let agencies compete for a buyer
--
-- The model was one agency per buyer: whoever asked first, introduced alone.
-- That is wrong for this business. There are only two or three serious
-- agencies in most of these places, and the buyer is better served when all
-- of them put forward a house and the best one wins.
--
-- So a lead can now be introduced to several agencies, and the consent trail
-- moves to the link between them rather than sitting on the lead as a single
-- name.
--
--   leads.intro_consent      still the buyer's answer: were they asked, and
--                            did they agree to be introduced at all
--   lead_partners.granted    which agencies that answer covers
--
-- Run after db/agency-loop.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

alter table lead_partners add column if not exists granted    boolean not null default false;
alter table lead_partners add column if not exists granted_at timestamptz;

comment on column lead_partners.granted is
  'This agency may see who the buyer is. Several agencies can hold it for one lead.';

-- Everything introduced under the old single-agency rule keeps its access.
update lead_partners lp
   set granted = true,
       granted_at = coalesce(lp.granted_at, l.intro_consent_at, lp.added_at)
  from leads l
 where l.id = lp.lead_id
   and l.intro_consent = 'yes'
   and l.intro_partner_id = lp.partner_id
   and lp.granted = false;


-- --------------------------------------------------------------------------
-- What an agency sees of a buyer it has been introduced to
-- --------------------------------------------------------------------------

drop view if exists partner_leads;

create view partner_leads
with (security_barrier = true, security_invoker = false) as
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


-- --------------------------------------------------------------------------
-- The board
--
-- A brief stays on it while other agencies could still pitch. It leaves this
-- agency's board once THEY have been introduced, or once the lead is closed.
-- Somebody else winning it does not take it off yours: you may still have the
-- better house, and the buyer is the one choosing.
--
-- The head start survives for anybody who genuinely holds a country alone,
-- but shared is now the ordinary case rather than the lesser one.
-- --------------------------------------------------------------------------

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
    -- How many agencies are already pitching for this buyer. Shown so an
    -- agency knows it is a race, which is the point of running one.
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
    -- Gone from your board only once YOU hold it.
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
-- Competition, at a glance: which buyers have more than one agency after them
-- --------------------------------------------------------------------------

create or replace view lead_competition as
  select l.id as lead_id,
         l.lead_no,
         l.country,
         count(*) filter (where pi.status in ('asked', 'pending')) as pitching,
         count(*) filter (where pi.status = 'granted')             as introduced,
         min(pi.created_at)                                        as first_asked
    from leads l
    join partner_interest pi on pi.lead_id = l.id
   group by l.id, l.lead_no, l.country;

grant select on lead_competition to authenticated;


select 'introductions carried over' as what, count(*) from lead_partners where granted
union all
select 'buyers with more than one agency pitching',
       count(*) from lead_competition where pitching > 1;
