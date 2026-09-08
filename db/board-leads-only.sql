-- ---------------------------------------------------------------------------
-- NQL Properties — keep messages and meeting requests off the agency board
--
-- Somebody using the footer form is asking a question. Somebody asking for a
-- meeting is asking for a meeting. Neither has said they want to buy a house,
-- so neither belongs on a board where agencies pay to ask for introductions.
--
-- Newsletter signups are excluded for a stronger reason: signing up for
-- updates is consent to be emailed by us, and nothing else. Offering those
-- people to agencies would make our own privacy policy untrue.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

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
    l.budget,
    l.deal_value,
    l.message,
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
    -- Buyers only.
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


-- What the pipeline is actually made of.
select case source
         when 'footer' then 'message, not a lead'
         when 'meeting' then 'meeting request, not a lead'
         when 'newsletter' then 'newsletter, not a lead'
         else 'lead'
       end as kind,
       count(*),
       count(country) as with_a_country
  from leads
 group by 1 order by 2 desc;
