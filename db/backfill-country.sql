-- ---------------------------------------------------------------------------
-- NQL Properties — work out where the old leads were looking
--
-- A restricted agency only sees leads with a country recorded, and the column
-- did not exist until last week. So roughly two hundred leads are invisible to
-- every agency, which is why a board filtered to Northern Cyprus shows four.
--
-- This fills the gap from what was already stored: the property they enquired
-- about, the project, what they typed about where, and the page they came
-- from. Same rules the live form now uses, so old and new leads end up
-- labelled the same way.
--
-- Only touches rows where country is null. Nothing already set is changed.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- Everything we might read a place out of, in one string per lead.
--
-- The message is included last and deliberately: somebody writing "I saw your
-- Italian houses but we want Spain" would be read as Italy by a keyword, so
-- the fields that state a fact come first and the free text is the fallback.
-- --------------------------------------------------------------------------

create or replace function public.guess_country(l leads)
returns text language plpgsql immutable as $$
declare
  stated text;
  loose  text;
begin
  -- What they were enquiring about. A property in Cortona is Italy whether or
  -- not anybody typed the word.
  stated := lower(concat_ws(' ',
    l.property_name, l.project_interest, l.location_detail, l.property_kinds));

  -- Weaker: the page they were on and their own words.
  loose := lower(concat_ws(' ', l.page_url, l.message));

  -- One Cyprus, north and south together: splitting it only meant a lead
  -- labelled one did not match an agency set to the other.
  if stated ~ 'cyprus|habitat|kyrenia|girne|esentepe|iskele|famagusta|limassol|paphos|larnaca' then return 'Cyprus';
  elsif stated ~ 'ital|tuscan|toscana|umbria|sicil|campania|puglia|apulia|marche|liguria|lazio|piedmont|assisi|cortona|siena|florence|firenze|perugia|arezzo|grosseto|chianti|maremma|lucca|pisa|todi|montepulciano|volterra|salerno|ragusa|vasanello|mugello|scarlino|ispica'
    then return 'Italy';
  elsif stated ~ 'spain|espa|andaluc|marbella|mallorca|ibiza|costa del sol|valencia|alicante' then return 'Spain';
  elsif stated ~ 'portugal|algarve|lisbon|lisboa|porto|cascais'    then return 'Portugal';
  elsif stated ~ 'france|proven|riviera|nice|antibes|cannes'       then return 'France';
  elsif stated ~ 'greece|greek|crete|corfu|santorini|mykonos'      then return 'Greece';
  elsif stated ~ 'malta|gozo|valletta'                            then return 'Malta';
  elsif stated ~ 'croatia|dalmat|split|dubrovnik|istria'           then return 'Croatia';
  elsif stated ~ 'montenegro|kotor|budva|tivat'                   then return 'Montenegro';
  elsif stated ~ 'turkey|bodrum|fethiye|antalya'                  then return 'Turkey';
  elsif stated ~ 'morocco|marrakech|essaouira|tangier'            then return 'Morocco';
  end if;

  -- Only now the weaker signals.
  if loose ~ 'cyprus|habitat|lp-cyprus'                 then return 'Cyprus';
  elsif loose ~ 'lp-italy|property-|ital|tuscan|umbria' then return 'Italy';
  end if;

  return null;
end;
$$;


-- --------------------------------------------------------------------------
-- What it would do, BEFORE it does it.
--
-- Read this first. If a rule is wrong it is wrong across dozens of rows, and
-- an agency acting on a mislabelled lead is worse than one seeing fewer.
-- --------------------------------------------------------------------------

select public.guess_country(l) as would_set, count(*)
  from leads l
 where l.country is null
   and l.source not in ('footer', 'meeting', 'newsletter')
 group by 1
 order by 2 desc;


-- --------------------------------------------------------------------------
-- Do it. Comment this block out if the figures above look wrong.
-- --------------------------------------------------------------------------

update leads l
   set country = public.guess_country(l)
 where l.country is null
   and l.source not in ('footer', 'meeting', 'newsletter')
   and public.guess_country(l) is not null;


-- --------------------------------------------------------------------------
-- Where the buyers are now, which is what an agency's board is drawn from.
-- --------------------------------------------------------------------------

select coalesce(country, 'still unknown') as country,
       count(*) as buyers,
       count(*) filter (where stage not in ('won', 'lost')
                          and coalesce(intro_consent, '') <> 'yes') as on_the_board
  from leads
 where source not in ('footer', 'meeting', 'newsletter')
 group by 1
 order by 2 desc;
