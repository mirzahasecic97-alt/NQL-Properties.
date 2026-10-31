-- The winter push, agreed 31 Oct 2026: one campaign, the American mountains
-- from Thanksgiving to February, with company trips as the second angle.
-- Two more rows in the marketing calendar so the posts over the next two
-- weeks have their dates. Run in the Supabase SQL editor; safe to run twice.

insert into marketing_events (title, starts_on, ends_on, dates_fixed, places, hook, first_post_on, reminder_on, notes) values
  ('January in the mountains', '2027-01-09', '2027-02-28', true,
   'Aspen, Colorado; Vail, Colorado; Beaver Creek, Colorado; Telluride, Colorado; Park City, Utah; Jackson Hole, Wyoming; Sun Valley, Idaho; Lake Tahoe, Nevada',
   'The quiet weeks after New Year, the same houses, better prices', '2026-11-05', '2026-11-12',
   'Winter push, post 2 of 3. Landing page nqlgroup.com/winter.'),
  ('Company trip to the mountains', '2027-01-15', '2027-02-28', true,
   'Aspen, Colorado; Park City, Utah; Jackson Hole, Wyoming; Lake Tahoe, Nevada',
   'Take the team somewhere they will talk about. One house, one call', '2026-11-09', '2026-11-16',
   'Winter push, post 3 of 3. Sells to companies planning Q1 offsites; Harvey companies campaign runs alongside.')
on conflict (lower(title)) do nothing;

update marketing_events set notes = coalesce(notes || ' ', '') || 'Winter push, post 1 of 3, 2 Nov. Landing page nqlgroup.com/winter.'
 where lower(title) = 'thanksgiving ski opening' and coalesce(notes, '') not like '%Winter push%';

select title, first_post_on, reminder_on from marketing_events where notes like '%Winter push%' order by first_post_on;
