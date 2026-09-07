-- ---------------------------------------------------------------------------
-- NQL Properties — a third band under fifty
--
-- Replaces the function from db/lead-match.sql. Run this on its own if you
-- have already run that file; it is included there too, so a fresh run does
-- not need this.
--
--   80 and over   hot
--   50 to 79      warm
--   1 to 49       limited
--   never set     nothing
--
-- The last two stay separate on purpose. A lead we measured and found thin is
-- not the same as one nobody has looked at, and an agency reading the board
-- should be able to tell those apart.
-- ---------------------------------------------------------------------------

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

select coalesce(match_band(match_score), 'not measured') as band, count(*)
  from leads group by 1 order by 2 desc;
