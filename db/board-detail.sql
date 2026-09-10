-- ---------------------------------------------------------------------------
-- NQL Properties — show an agency the whole brief, minus who it is
--
-- The board carried a budget band and a country. That is enough to sort by and
-- not enough to judge by: an agency cannot tell whether they can help without
-- reading what the buyer actually asked for.
--
-- So it now carries everything about the ENQUIRY and nothing about the PERSON.
--
--   shown    what they wrote, budget as stated, deal value, country, property
--            or project, meeting format and timing, stage, how long they have
--            been waiting, how complete the brief is
--
--   never    first name, last name, email address, phone number,
--            the page they came from, the raw form payload
--
-- The last two are excluded for a reason worth stating: page_url can carry a
-- campaign tag that identifies a person to whoever placed the ad, and `raw` is
-- a complete copy of the submission including the name and the phone number.
--
-- NOTE ON WHAT THIS MEANS. A message is free text. Somebody who writes "I am
-- Bjorn, my number is 6911115, ring me" has put their name and number on a
-- board that agencies read before consent. Nothing here can prevent that. The
-- privacy policy has been changed to say the board carries what you wrote, so
-- the page and the practice agree, but if that trade is not one you want, the
-- line to remove is `l.message`.
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
    and l.source not in ('meeting', 'newsletter')
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


-- An agency tells us why it is asking. The column already exists; this makes
-- sure the policy lets them write it, which it does by not mentioning it.
select 'note column exists' as check,
       exists (
         select 1 from information_schema.columns
          where table_name = 'partner_interest' and column_name = 'note'
       ) as ok;

-- What a board row now looks like. Run it as yourself and it returns nothing,
-- which is correct: the board answers agency accounts only.
select count(*) as rows_for_you from partner_board;
