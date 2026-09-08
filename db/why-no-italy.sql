-- ---------------------------------------------------------------------------
-- NQL Properties — why an agency switched on for Italy sees nothing
--
-- READ ONLY, and one single statement. It names no column of leads or
-- partners directly, so it works whatever shape those tables are in. It
-- creates nothing, drops nothing, changes nothing.
--
-- Run in the Supabase SQL editor. Send back the row it gives.
-- ---------------------------------------------------------------------------

select
  -- Does the board the portal reads from still exist?
  (to_regclass('public.partner_board')     is not null) as board_view,
  (to_regclass('public.partner_countries') is not null) as countries_table,
  (to_regclass('public.partner_interest')  is not null) as interest_table,

  -- Does the board still hold new leads back for 48 hours?
  coalesce(
    pg_get_viewdef(to_regclass('public.partner_board')) like '%head_start%',
    false
  ) as board_has_48h_delay,

  -- The two columns the country filter depends on.
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'leads'
             and column_name = 'country')    as leads_have_country,
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'partners'
             and column_name = 'sees_leads') as partners_have_sees_leads,

  -- How many buyers there are at all, using only columns that have been
  -- there since the beginning.
  (select count(*) from leads)                                  as leads_total,
  (select count(*) from leads where stage not in ('won','lost')) as leads_live;
