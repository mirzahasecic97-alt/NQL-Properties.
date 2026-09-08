-- ---------------------------------------------------------------------------
-- NQL Properties — give every lead the country it is about
--
-- Part 2 of 4. Run them in order. The Supabase editor runs everything you
-- paste as one transaction, so a single bad line rolls the whole thing back.
-- Split up, a failure lands on one part and the parts before it stay done.
-- ---------------------------------------------------------------------------

update leads set country = 'Cyprus'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ 'cyprus|habitat|kyrenia|girne|esentepe|iskele|famagusta|lp-cyprus';

update leads set country = 'Italy'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ '\mital|tuscan|toscana|umbria|sicil|puglia|apulia|marche|liguria|assisi|cortona|siena|florence|firenze|perugia|arezzo|grosseto|chianti|maremma|lucca|\mpisa|\mtodi|montepulciano|volterra|scarlino|ispica|vasanello|mugello|lp-italy';

update leads set country = 'Spain'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ '\mspain|\mespa|andaluc|marbella|mallorca|ibiza|costa del sol|alicante';

update leads set country = 'Portugal'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ 'portugal|algarve|lisbon|lisboa|cascais';

update leads set country = 'France'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ '\mfrance|\mfrench|provence|riviera|antibes|cannes';

update leads set country = 'Greece'
 where country is null
   and lower(concat_ws(' ', property_name, project_interest, location_detail,
                            property_kinds, page_url, message))
       ~ 'greece|greek|crete|corfu|santorini|mykonos';



update partners set sees_leads = true where sees_leads is null;

select coalesce(country, 'STILL BLANK') as country, count(*) as leads
  from leads
 where source not in ('footer','meeting','newsletter','agency')
   and stage  not in ('won','lost')
 group by 1 order by 2 desc;
