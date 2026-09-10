-- ---------------------------------------------------------------------------
-- NQL Properties — give every lead the country it is obviously about
--
-- An agency switched on for Italy only sees leads whose country says Italy.
-- The column arrived late, so most leads have it blank and match nobody. That
-- is why a board filtered to one country looks empty.
--
-- This reads the country out of what is already on the lead: the property they
-- asked about, the project, where they said they were looking, the page they
-- came from, what they typed, and the raw form payload.
--
-- SAFE BY CONSTRUCTION
--   nothing is dropped, no view is touched, no policy is touched
--   every column it reads is added first if missing, so it cannot fail on a
--     column that lives in a migration that never ran
--   only rows where country is blank are written to, so anything you set by
--     hand stays as you set it
--   re-running it does the same thing again
--
-- Run in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 0. Every column this reads, in case the file that added it never ran.
--    Adding a column that is already there does nothing.
-- --------------------------------------------------------------------------

alter table leads add column if not exists country          text;
alter table leads add column if not exists location_detail  text;
alter table leads add column if not exists property_kinds   text;
alter table leads add column if not exists project_interest text;
alter table leads add column if not exists page_url         text;
alter table leads add column if not exists intro_consent    text;


-- --------------------------------------------------------------------------
-- 1. Reading a country out of a lead.
--
-- Two passes, and the order matters. Fields that state a fact are read first:
-- a property in Cortona is Italy whether or not anybody typed the word. Only
-- if those say nothing do we fall back to the page and the person's own words,
-- because "I saw your Italian houses but we want Spain" reads as Italy to a
-- keyword and as Spain to a human.
--
-- The loose pass is deliberately narrower than the stated one. "capital" holds
-- ital, "proven" holds proven, "split" is an ordinary word. Anything that
-- could turn up in an English sentence by accident is either bounded to a word
-- start with \m or left out of the loose pass entirely.
-- --------------------------------------------------------------------------

create or replace function public.guess_country(l leads)
returns text language plpgsql immutable as $$
declare
  stated text;
  loose  text;
begin
  stated := lower(concat_ws(' ',
    l.property_name, l.project_interest, l.location_detail, l.property_kinds));

  loose := lower(concat_ws(' ',
    l.page_url, l.message, l.raw::text));

  -- Pass one: what the lead is about.
  -- One Cyprus, north and south together. Splitting it only meant a lead
  -- filed under one did not match an agency set to the other.
  if stated ~ 'cyprus|habitat|kyrenia|girne|esentepe|iskele|famagusta|limassol|paphos|larnaca'
    then return 'Cyprus';
  elsif stated ~ '\mital|tuscan|toscana|umbria|sicil|campania|puglia|apulia|marche|liguria|lazio|piedmont|assisi|cortona|siena|florence|firenze|perugia|arezzo|grosseto|chianti|maremma|lucca|pisa|todi|montepulciano|volterra|salerno|ragusa|vasanello|mugello|scarlino|ispica'
    then return 'Italy';
  elsif stated ~ '\mspain|\mespa|andaluc|marbella|mallorca|ibiza|costa del sol|valencia|alicante'
    then return 'Spain';
  elsif stated ~ 'portugal|algarve|lisbon|lisboa|\mporto\M|cascais'
    then return 'Portugal';
  elsif stated ~ '\mfrance|\mfrench|provence|riviera|\ynice\y|antibes|cannes'
    then return 'France';
  elsif stated ~ 'greece|greek|crete|corfu|santorini|mykonos'
    then return 'Greece';
  elsif stated ~ 'malta|gozo|valletta'
    then return 'Malta';
  elsif stated ~ 'croatia|dalmat|dubrovnik|istria|\msplit\M'
    then return 'Croatia';
  elsif stated ~ 'montenegro|kotor|budva|tivat'
    then return 'Montenegro';
  elsif stated ~ 'turkey|turkiye|türkiye|bodrum|fethiye|antalya'
    then return 'Turkey';
  elsif stated ~ 'morocco|marrakech|essaouira|tangier'
    then return 'Morocco';
  end if;

  -- Pass two: the page they were on, what they wrote, and the raw payload.
  if loose ~ 'cyprus|habitat|lp-cyprus|kyrenia|girne|esentepe|iskele'
    then return 'Cyprus';
  elsif loose ~ 'lp-italy|property-|\mital|tuscan|toscana|umbria|sicil|puglia'
    then return 'Italy';
  elsif loose ~ '\mspain|\mespa|andaluc|marbella|mallorca|ibiza'
    then return 'Spain';
  elsif loose ~ 'portugal|algarve|lisbon|lisboa'
    then return 'Portugal';
  elsif loose ~ '\mfrance|\mfrench|provence|riviera|antibes|cannes'
    then return 'France';
  elsif loose ~ 'greece|greek|crete|corfu|santorini|mykonos'
    then return 'Greece';
  elsif loose ~ 'malta|gozo|valletta'
    then return 'Malta';
  elsif loose ~ 'croatia|dalmat|dubrovnik|istria'
    then return 'Croatia';
  elsif loose ~ 'montenegro|kotor|budva|tivat'
    then return 'Montenegro';
  elsif loose ~ 'turkey|turkiye|türkiye|bodrum|fethiye|antalya'
    then return 'Turkey';
  elsif loose ~ 'morocco|marrakech|essaouira|tangier'
    then return 'Morocco';
  end if;

  return null;
end;
$$;


-- --------------------------------------------------------------------------
-- 2. Fill the blanks. Buyers only: meeting requests and
--    newsletter signups are not people looking for a house.
-- --------------------------------------------------------------------------

update leads l
   set country = public.guess_country(l)
 where l.country is null
   and l.source not in ('meeting', 'newsletter')
   and public.guess_country(l) is not null;


-- --------------------------------------------------------------------------
-- 3. Where the buyers are now. This is what an agency's board is drawn from,
--    so a country with buyers here is a country an agency can be switched on
--    for and see something.
-- --------------------------------------------------------------------------

select coalesce(country, 'STILL UNKNOWN') as country,
       count(*)                           as buyers,
       count(*) filter (where stage not in ('won', 'lost')) as live
  from leads
 where source not in ('meeting', 'newsletter')
 group by 1
 order by 2 desc;
