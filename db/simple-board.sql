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
--   4  footer messages, meeting requests, newsletter signups and other
--      agencies asking for a demo, none of whom are buyers
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

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
    'shared'::text                             as my_tier
  from leads l
  where public.is_partner_user()
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
 where l.source not in ('footer', 'meeting', 'newsletter', 'agency')
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
