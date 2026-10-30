-- Rental enquiries are their own kind in the CRM and never appear on the
-- agency board. Asked for on 30 Oct 2026: everything that comes through
-- "Rent" on the contact form lands in a Rentals list of its own.
--
-- Three things, each safe to run twice:
--   1. Enquiries already in that said Rent move to the new source, so the
--      list starts full rather than empty.
--   2. The board is rebuilt beside the old one with 'rent' excluded, and
--      swapped in once it compiles.
--   3. A count at the end, so you see the number rather than "Success".

-- 1. The ones already in. Only website enquiries; anything filed by hand
--    keeps the source somebody chose for it.
update leads
   set source = 'rent'
 where purpose = 'Rent'
   and source in ('contact', 'footer', 'property');

-- 2. The board. Same definition as sellers.sql, one more source kept off.
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
      coalesce(l.match_score, public.brief_score(l))
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
    and l.source not in ('meeting', 'newsletter', 'agency', 'seller', 'rent')
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


-- 3. What moved.
select count(*) as rental_enquiries_in_their_own_list from leads where source = 'rent';
