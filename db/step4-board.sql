-- ---------------------------------------------------------------------------
-- NQL Properties — the board itself, swapped in only once it compiles
--
-- Part 4 of 4. Run them in order. The Supabase editor runs everything you
-- paste as one transaction, so a single bad line rolls the whole thing back.
-- Split up, a failure lands on one part and the parts before it stay done.
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
    -- The switch, read as Postgres reads it. Unset was fixed in step 3.
    and coalesce((select p.sees_leads from partners p
                   where p.id = public.my_partner_id()), false)
    -- Buyers only.
    and l.source not in ('meeting', 'newsletter', 'agency')
    and l.stage  not in ('won', 'lost')
    -- Not one already introduced to them; those live under My leads.
    and not exists (
      select 1 from lead_partners lp
       where lp.lead_id = l.id
         and lp.partner_id = public.my_partner_id()
         and lp.granted
    )
    -- The control panel decides this line. No countries chosen means every
    -- country. Choose Italy and Italy is what they get, nothing else.
    and (
      not exists (
        select 1 from partner_countries pc where pc.partner_id = public.my_partner_id()
      )
      or l.country in (
        select pc.country from partner_countries pc
         where pc.partner_id = public.my_partner_id()
      )
    );

-- It compiled. Swap it in.
drop view if exists partner_board;
alter view partner_board_new rename to partner_board;

grant select on partner_board to authenticated;


-- ==========================================================================
-- 6. Everything else the portal reads, in case one of these lost its grant
--    the same way the board did. Missing ones are skipped, not thrown.
-- ==========================================================================

do $$
declare r record;
begin
  for r in
    select * from (values
      ('partner_leads',     'select'),
      ('partner_countries', 'select'),
      ('partner_interest',  'select, insert, update, delete'),
      ('partner_offers',    'select, insert, update, delete'),
      ('fix_requests',      'select, insert, update, delete')
    ) as t(rel, privs)
  loop
    if to_regclass('public.' || r.rel) is null then
      raise notice 'skipped %, not present', r.rel;
    else
      execute format('grant %s on public.%I to authenticated', r.privs, r.rel);
    end if;
  end loop;
end $$;


-- ==========================================================================
-- 7. What each agency will see when it opens the portal.
-- ==========================================================================

select p.name                                                     as agency,
       case when p.sees_leads then 'on' else 'SWITCHED OFF' end   as portal,
       coalesce((select string_agg(pc.country, ', ' order by pc.country)
                   from partner_countries pc where pc.partner_id = p.id),
                'every country')                                  as covers,
       (select count(*) from leads l
         where p.sees_leads
           and l.source not in ('meeting', 'newsletter', 'agency')
           and l.stage  not in ('won', 'lost')
           and (
             not exists (select 1 from partner_countries pc where pc.partner_id = p.id)
             or l.country in (select pc.country from partner_countries pc
                               where pc.partner_id = p.id)
           ))                                                     as buyers_they_see
  from partners p
 where p.status is distinct from 'former'
 order by 4 desc, 1;
