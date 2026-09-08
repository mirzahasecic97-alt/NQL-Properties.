-- ---------------------------------------------------------------------------
-- NQL Properties — why an agency switched on for Italy still sees nothing
--
-- READ ONLY. Every statement here is a select. It creates nothing, drops
-- nothing, changes nothing. Running it twice does the same as running it once,
-- which is nothing.
--
-- Run in the Supabase SQL editor and send back the four results.
-- ---------------------------------------------------------------------------

-- 1. Is the board view still there, and does it still hold leads back?
select case
         when to_regclass('public.partner_board') is null
           then 'MISSING: the board view is gone, so every agency sees nothing'
         when pg_get_viewdef(to_regclass('public.partner_board')) like '%head_start%'
           then 'present, BUT holds new leads back for 48 hours'
         else 'present, no delay'
       end as board_view;


-- 2. What country are the live buyers actually filed under?
--    An agency set to Italy matches leads whose country is exactly Italy.
--    Blank matches nothing.
select coalesce(country, '(blank)') as filed_under,
       count(*)                     as buyers
  from leads
 where source not in ('footer', 'meeting', 'newsletter', 'agency')
   and stage  not in ('won', 'lost')
 group by 1
 order by 2 desc;


-- 3. What is the test agency set to?
select p.name,
       case when p.sees_leads then 'portal on' else 'PORTAL OFF' end as portal,
       coalesce(pc.country, '(no country set = every country)')      as country,
       coalesce(pc.tier, '-')                                        as tier
  from partners p
  left join partner_countries pc on pc.partner_id = p.id
 where p.name = 'ZZ Test Agency';


-- 4. How many buyers would an Italy agency see, counted straight from the
--    same four rules the board uses, minus the delay.
select count(*) as italy_buyers_that_should_show
  from leads
 where country = 'Italy'
   and source not in ('footer', 'meeting', 'newsletter', 'agency')
   and stage  not in ('won', 'lost');
