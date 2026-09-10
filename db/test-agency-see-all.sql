-- ---------------------------------------------------------------------------
-- NQL Properties — let the test agency see the whole board
--
-- An agency with no countries set has no restriction at all. That is the
-- switch: clearing the rows, not ticking more of them, because a row saying
-- "shared" also brings the two day head start with it.
--
-- Only touches ZZ Test Agency. Every real agency keeps what it has.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

delete from partner_countries
 where partner_id in (select id from partners where name = 'ZZ Test Agency');

-- Its own country field seeded those rows in the first place, so clear that
-- too or the next run of db/partner-countries.sql puts them back.
update partners set country = null where name = 'ZZ Test Agency';


-- --------------------------------------------------------------------------
-- What the board would now hold, and what is being left out of it.
--
-- If the number is still small, this says which rule is doing it rather than
-- leaving it to be guessed at.
-- --------------------------------------------------------------------------

select 'would show on the board' as reason, count(*)
  from leads
 where source not in ('meeting', 'newsletter')
   and stage not in ('won', 'lost')
union all
select 'held back: a message or a meeting request', count(*)
  from leads where source in ('meeting', 'newsletter')
union all
select 'held back: won or lost', count(*)
  from leads where stage in ('won', 'lost')
union all
select 'of those shown, with no country recorded', count(*)
  from leads
 where source not in ('meeting', 'newsletter')
   and stage not in ('won', 'lost')
   and country is null;

-- Where the buyers actually are, so it is clear whether four Cyprus leads was
-- the restriction or simply what we hold.
select coalesce(country, 'no country set') as country, count(*)
  from leads
 where source not in ('meeting', 'newsletter')
   and stage not in ('won', 'lost')
 group by 1
 order by 2 desc;

-- And what the test agency is restricted to now. Should be empty.
select p.name, pc.country, pc.tier
  from partners p left join partner_countries pc on pc.partner_id = p.id
 where p.name = 'ZZ Test Agency';
