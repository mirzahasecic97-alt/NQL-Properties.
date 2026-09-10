-- ---------------------------------------------------------------------------
-- NQL Properties — footer messages are leads
--
-- The board used to leave out anyone who wrote through the footer form. They
-- are leads now, in the CRM and on the agency board alike. This rebuilds the
-- board beside the old one and swaps only once the new one has compiled, so a
-- mistake here leaves the board you have untouched.
--
-- Paste the whole file into the Supabase SQL editor and run it.
-- ---------------------------------------------------------------------------

drop view if exists partner_board_new;

create view partner_board_new
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
    and coalesce((select p.sees_leads from partners p
                   where p.id = public.my_partner_id()), false)
    and l.source not in ('meeting', 'newsletter', 'agency')
    and l.stage  not in ('won', 'lost')
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
      or l.country in (
        select pc.country from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
    );

drop view if exists partner_board;
alter view partner_board_new rename to partner_board;
grant select on partner_board to authenticated;

select count(*) as footer_leads_now_on_the_board
  from leads
 where source = 'footer' and stage not in ('won', 'lost');
