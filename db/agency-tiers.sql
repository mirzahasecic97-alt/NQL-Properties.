-- ---------------------------------------------------------------------------
-- NQL Properties — exclusivity, and the head start it buys
--
-- An agency will pay for "you are our only agency in Umbria" long before it
-- pays for a better screen. It costs us nothing to offer and it is worth real
-- money to them, because the agency down the road is who they are actually
-- afraid of.
--
-- Three tiers per country, on the row that already decides who sees what:
--
--   exclusive  sees a brief the moment it arrives. One agency per country.
--   shared     sees the same brief after the head start has passed.
--   waiting    sees nothing there yet. On the list, not in the room.
--
-- The head start is the product. Two days is long enough to be worth paying
-- for and short enough that a shared agency still gets a real board.
--
-- Run after db/partner-countries.sql and db/mandate-fields.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

alter table partner_countries add column if not exists tier text
  not null default 'shared'
  check (tier in ('exclusive', 'shared', 'waiting'));

comment on column partner_countries.tier is
  'exclusive sees briefs at once and is unique per country; shared sees them after the head start; waiting sees none.';

-- One exclusive agency per country, enforced rather than remembered. Selling
-- the same exclusivity twice is the one mistake here that cannot be undone
-- with an apology.
create unique index if not exists partner_countries_one_exclusive
  on partner_countries (country) where tier = 'exclusive';


-- --------------------------------------------------------------------------
-- How long a shared agency waits.
--
-- A function rather than a number in the view, so it can be changed in one
-- place and read from the portal to tell an agency what it is waiting for.
-- --------------------------------------------------------------------------

create or replace function public.head_start()
returns interval language sql immutable as $$
  select interval '48 hours';
$$;

grant execute on function public.head_start() to authenticated;


-- --------------------------------------------------------------------------
-- The board, with the head start on it.
--
-- Reading the tier for the lead's own country, not the agency's first: an
-- agency exclusive in Italy and shared in Spain waits for Spanish briefs and
-- not for Italian ones.
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
    )                                          as asked,
    -- What this agency's standing is where this buyer is looking, so the
    -- portal can say why a board is thin rather than leaving them to wonder.
    coalesce(
      (select pc.tier from partner_countries pc
        where pc.partner_id = public.my_partner_id() and pc.country = l.country),
      'shared'
    )                                          as my_tier
  from leads l
  where public.is_partner_user()
    and l.source not in ('meeting', 'newsletter')
    and l.stage not in ('won', 'lost')
    and coalesce(l.intro_consent, '') <> 'yes'
    and (
      -- No countries chosen at all still means no restriction.
      not exists (
        select 1 from partner_countries pc
         where pc.partner_id = public.my_partner_id()
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
-- What an agency has to show for it.
--
-- deal_value joins partner_leads so they can total what they have sold
-- through us. It is their deal; the commission on it is ours and stays here.
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
    l.intro_consent_at,
    lp.outcome, lp.outcome_at, lp.outcome_note
  from leads l
  join lead_partners lp on lp.lead_id = l.id
  where public.is_partner_user()
    and lp.partner_id = public.my_partner_id()
    and l.intro_consent = 'yes'
    and l.intro_partner_id = public.my_partner_id();

grant select on partner_leads to authenticated;


-- Who holds what, and where nobody does.
select p.name as agency, pc.country, pc.tier
  from partner_countries pc join partners p on p.id = pc.partner_id
 order by pc.country, pc.tier, p.name;

select l.country, count(*) as live_briefs,
       coalesce((select p.name from partner_countries pc
                   join partners p on p.id = pc.partner_id
                  where pc.country = l.country and pc.tier = 'exclusive'), 'nobody') as exclusive_to
  from leads l
 where l.source not in ('meeting','newsletter')
   and l.stage not in ('won','lost')
   and coalesce(l.intro_consent,'') <> 'yes'
   and l.country is not null
 group by l.country
 order by 2 desc;
