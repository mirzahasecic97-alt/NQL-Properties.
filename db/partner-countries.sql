-- ---------------------------------------------------------------------------
-- NQL Properties — which countries an agency works in
--
-- An agency that only sells in Italy has no business reading enquiries about
-- Cyprus. This restricts each agency's board to the countries it covers.
--
-- An agency with no countries listed sees everything, so adding this file
-- breaks nobody: the restriction is something you switch on per agency. Rows
-- are seeded from the country already on each agency record, so any agency
-- you have filled that in for is restricted from the moment this runs.
--
-- A restricted agency does not see leads with no country at all. If we do not
-- know where somebody wants to buy, we cannot say an Italian agency is the
-- right home for them.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists partner_countries (
  partner_id uuid not null references partners(id) on delete cascade,
  country    text not null,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id) on delete set null,
  primary key (partner_id, country)
);

create index if not exists partner_countries_country_idx on partner_countries (country);

comment on table partner_countries is
  'Countries an agency covers. No rows means no restriction, which is how an agency starts.';

-- Seed from what is already on the agency record.
insert into partner_countries (partner_id, country)
select id, country from partners
 where country is not null and trim(country) <> ''
on conflict do nothing;

alter table partner_countries enable row level security;

-- Staff manage them. An agency may read its own, so the portal can say what
-- it is filtered to.
drop policy if exists "read partner countries"  on partner_countries;
drop policy if exists "staff write partner countries" on partner_countries;
create policy "read partner countries"
  on partner_countries for select to authenticated
  using (public.is_nql_staff() or partner_id = public.my_partner_id());
create policy "staff write partner countries"
  on partner_countries for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());

grant select, insert, update, delete on partner_countries to authenticated;


-- Rebuild the board with the restriction on it.
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
    -- Buyers only. A footer question and a meeting request are not people who
    -- have said they want to buy a house, and a newsletter signup is consent
    -- to be emailed by us and nothing else.
    and l.source not in ('meeting', 'newsletter')
    and l.stage not in ('won', 'lost')
    and coalesce(l.intro_consent, '') <> 'yes'
    -- No countries listed means no restriction. Listed means those only, and
    -- a lead with no country is not among them.
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


-- Who is restricted to what.
select p.name as agency,
       coalesce(string_agg(pc.country, ', ' order by pc.country), 'everywhere') as sees
  from partners p
  left join partner_countries pc on pc.partner_id = p.id
 group by p.name
 order by p.name;
