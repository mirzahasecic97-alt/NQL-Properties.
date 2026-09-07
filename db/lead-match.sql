-- ---------------------------------------------------------------------------
-- NQL Properties — how well a lead is matched
--
-- How much of what the buyer asked for we can actually show them. Set by us,
-- in the CRM, because we are the only ones who know both the brief and what
-- is on our books.
--
--   80 and over   Hot
--   50 to 79      Warm
--   under 50      shown as nothing
--
-- A lead nobody has assessed shows nothing either, which is deliberate: an
-- unassessed lead and a poorly matched one are different things, and calling
-- the first one cold would be a lie an agency acts on.
--
-- Agencies see the word, never the number. A band is a signal; a figure
-- invites an argument about whether it should be 78 or 82.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

alter table leads add column if not exists match_score smallint
  check (match_score between 0 and 100);

alter table leads add column if not exists match_note text;

comment on column leads.match_score is
  'Share of the buyer''s requirements we can meet, 0 to 100. Drives the Hot and Warm badges.';
comment on column leads.match_note is
  'What is missing, or what makes it a good fit. Internal, never shown to an agency.';


-- The word, from the number. One place, so the CRM and the portal can never
-- disagree about where warm ends and hot begins.
create or replace function public.match_band(score smallint)
returns text language sql immutable as $$
  select case
    when score is null then null
    when score >= 80   then 'hot'
    when score >= 50   then 'warm'
    when score >= 1    then 'limited'
    else null
  end;
$$;

grant execute on function public.match_band(smallint) to authenticated;


-- Rebuild the board with the band on it.
--
-- Dropped and recreated rather than replaced: "create or replace view" may
-- only append columns to the end of the list, and match_band belongs beside
-- budget_band, not after the flags. Replacing in place fails with "cannot
-- change name of view column". Nothing depends on this view, so dropping it
-- costs only the grant, which is put back below.
drop view if exists partner_board;

create view partner_board
with (security_barrier = true) as
  select
    l.id,
    l.lead_no,
    l.created_at,
    l.stage,
    l.country,
    l.property_name,
    l.project_interest,
    public.budget_band(l.budget, l.deal_value) as budget_band,
    public.match_band(l.match_score)           as match_band,
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

select match_band(match_score) as band, count(*)
  from leads group by 1 order by 1;
