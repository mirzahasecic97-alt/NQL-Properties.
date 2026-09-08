-- ---------------------------------------------------------------------------
-- NQL Properties — how complete a lead is
--
-- Hot, Warm and Limited now measure how much of the mandate the buyer
-- actually gave us. Somebody who answered everything is hot; somebody who
-- left an email address and nothing else is limited.
--
-- This is a correction. The first version measured how much of the buyer's
-- brief we could cover from our own books, which is a different question and
-- not the one being asked.
--
-- Because it counts filled in fields, it needs nobody to maintain it. The
-- score moves on its own as a lead is worked, and it is never out of date.
--
-- Seven things are asked for. Each is worth a seventh:
--
--   1  a name            5  budget, either what they said or what we booked
--   2  an email          6  what they are looking for
--   3  a phone number    7  their own words
--   4  which country
--
--   7 of 7  100   hot        4 of 7   57   warm
--   6 of 7   86   hot        3 of 7   43   limited
--   5 of 7   71   warm       0 of 7    0   no badge
--
-- match_score stays as a manual override. Set it and it wins; leave it null
-- and the count decides. The column keeps its old name so nothing that reads
-- it has to change.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

create or replace function public.info_score(
  first_name text, last_name text, email text, phone text,
  country text, budget text, deal_value numeric,
  property_name text, project_interest text, message text
) returns smallint language sql immutable as $$
  select (
    round(
      100.0 * (
        (nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '') is not null)::int
      + (nullif(trim(coalesce(email, '')), '') is not null)::int
      + (nullif(trim(coalesce(phone, '')), '') is not null)::int
      + (nullif(trim(coalesce(country, '')), '') is not null)::int
      + ((nullif(trim(coalesce(budget, '')), '') is not null) or (deal_value is not null))::int
      + (nullif(trim(coalesce(property_name, '') || coalesce(project_interest, '')), '') is not null)::int
      + (nullif(trim(coalesce(message, '')), '') is not null)::int
      ) / 7.0
    )
  )::smallint;
$$;

grant execute on function public.info_score(
  text, text, text, text, text, text, numeric, text, text, text
) to authenticated;

comment on column leads.match_score is
  'Manual override for the Hot and Warm badge, 0 to 100. Null means the badge follows info_score() instead, which counts how much of the mandate the buyer gave us.';


-- Rebuild the board on the new score. Dropped rather than replaced: "create
-- or replace view" may only append columns, and this changes one in place.
drop view if exists partner_board;

create view partner_board
with (security_barrier = true, security_invoker = false) as
  select
    l.id,
    l.lead_no,
    l.created_at,
    l.stage,
    l.country,
    l.property_name,
    l.project_interest,
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
    and l.stage not in ('won', 'lost')
    and coalesce(l.intro_consent, '') <> 'yes';

grant select on partner_board to authenticated;


-- Where the pipeline stands on completeness.
select coalesce(
         public.match_band(
           coalesce(match_score, public.info_score(
             first_name, last_name, email, phone, country,
             budget, deal_value, property_name, project_interest, message))),
         'no badge') as band,
       count(*)
  from leads
 group by 1 order by 2 desc;
