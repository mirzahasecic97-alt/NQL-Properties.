-- ---------------------------------------------------------------------------
-- NQL Properties — a column per question, instead of one long paragraph
--
-- The mandate asked nine useful questions and then folded every answer into a
-- single block of prose in `message`. That made the whole brief unreadable by
-- anything except a person, and it meant the only way to show an agency what a
-- buyer wants was to show them the message, which also carries whatever the
-- buyer chose to type.
--
-- Each answer now has its own column. The board shows the answers. `message`
-- goes back to being what somebody wrote to us in their own words, which is
-- ours and is not shown to anybody outside.
--
-- All text, deliberately. These are answers a person picked from a list that
-- will be a different list within the year, and a rigid schema here would be
-- wrong before it was useful.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

alter table leads add column if not exists based_in        text;
alter table leads add column if not exists location_detail text;
alter table leads add column if not exists property_kinds  text;
alter table leads add column if not exists bedrooms        text;
alter table leads add column if not exists land            text;
alter table leads add column if not exists must_haves      text;
alter table leads add column if not exists dealbreakers    text;
alter table leads add column if not exists timeline        text;
alter table leads add column if not exists purpose         text;

comment on column leads.based_in        is 'Where the buyer lives, in their words.';
comment on column leads.location_detail is 'Where they want to buy, more precisely than the country.';
comment on column leads.property_kinds  is 'Villa, farmhouse, apartment and so on. Comma separated.';
comment on column leads.must_haves      is 'The things it has to have. Comma separated.';
comment on column leads.dealbreakers    is 'What would rule a place out.';
comment on column leads.timeline        is 'How soon they want to buy.';
comment on column leads.purpose         is 'To live in, to let, a business.';


-- --------------------------------------------------------------------------
-- The board: the brief, and only the brief.
--
--   shown    where, how many rooms, how much land, budget, what sort of
--            place, must haves, deal breakers, when, what for, where they
--            live, stage, how long they have waited
--
--   never    first name, last name, email, phone, the message, the page they
--            came from, the raw payload
--
-- `message` is out again on purpose. It is free text: it carries whatever the
-- buyer decided to type, including their name and telephone number, and it is
-- also where we keep what they said to us rather than what they want. The
-- structured answers say everything an agency needs to judge a brief, without
-- either problem.
-- --------------------------------------------------------------------------

drop view if exists partner_board;

create view partner_board
with (security_barrier = true, security_invoker = false) as
  select
    l.id,
    l.lead_no,
    l.created_at,
    l.stage,
    l.country,
    l.location_detail,
    l.based_in,
    l.property_name,
    l.project_interest,
    l.property_kinds,
    l.bedrooms,
    l.land,
    l.must_haves,
    l.dealbreakers,
    l.timeline,
    l.purpose,
    l.budget,
    l.deal_value,
    l.meeting_format,
    l.preferred_date,
    l.preferred_time,
    public.budget_band(l.budget, l.deal_value) as budget_band,
    public.match_band(
      coalesce(
        l.match_score,
        public.info_score(
          l.first_name, l.last_name, l.email, l.phone, l.country,
          l.budget, l.deal_value, l.property_name, l.project_interest, l.message
        )
      )
    )                                          as match_band,
    (l.intro_consent = 'yes')                  as introduced,
    exists (
      select 1 from partner_interest pi
       where pi.lead_id = l.id and pi.partner_id = public.my_partner_id()
    )                                          as asked
  from leads l
  where public.is_partner_user()
    and l.source not in ('footer', 'meeting', 'newsletter')
    and l.stage not in ('won', 'lost')
    and coalesce(l.intro_consent, '') <> 'yes'
    and (
      not exists (
        select 1 from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
      or l.country in (
        select pc.country from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
    );

grant select on partner_board to authenticated;


-- How much of the pipeline has a brief worth showing.
select count(*)                     as leads,
       count(location_detail)       as with_a_place,
       count(property_kinds)        as with_a_property_type,
       count(bedrooms)              as with_bedrooms,
       count(must_haves)            as with_must_haves
  from leads
 where source not in ('footer', 'meeting', 'newsletter');
