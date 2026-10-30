-- The marketing calendar: the events we post around, drawn in the CRM
-- calendar beside reminders, meetings and tasks. Mirza, 30 Oct 2026:
-- "Place it in the crm calendar." Run in the Supabase SQL editor. Safe to
-- run twice: an event already in by title is left alone.

create table if not exists marketing_events (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  title            text not null,
  starts_on        date not null,
  ends_on          date,
  dates_fixed      boolean not null default false,   -- false: the usual window, to confirm
  places           text,     -- as written on the Destinations page, separated by ;
  hook             text,     -- the line the post is built on
  first_post_on    date,
  reminder_on      date,
  first_posted     boolean not null default false,
  reminder_posted  boolean not null default false,
  notes            text
);
create unique index if not exists marketing_events_title_idx on marketing_events (lower(title));
alter table marketing_events enable row level security;
drop policy if exists "staff read marketing"  on marketing_events;
drop policy if exists "staff write marketing" on marketing_events;
create policy "staff read marketing"  on marketing_events for select to authenticated using (public.is_nql_staff());
create policy "staff write marketing" on marketing_events for all    to authenticated using (public.is_nql_staff()) with check (public.is_nql_staff());
grant select, insert, update, delete on marketing_events to authenticated;

insert into marketing_events (title, starts_on, ends_on, dates_fixed, places, hook, first_post_on, reminder_on, notes) values
  ('Thanksgiving ski opening', '2026-11-25', '2026-11-29', true, 'Aspen, Colorado; Vail, Colorado; Park City, Utah', 'First tracks of the season, the house to come back to', '2026-11-02', '2026-11-10', null),
  ('F1 Abu Dhabi Grand Prix, season finale', '2026-12-04', '2026-12-06', false, 'Abu Dhabi, United Arab Emirates', 'The last race, a villa on Saadiyat, the paddock a short drive', '2026-11-02', '2026-11-20', null),
  ('Festive season 2026', '2026-12-20', '2027-01-05', true, 'St. Barth, France; Maldives; Dubai, United Arab Emirates; Courchevel, France; Gstaad, Switzerland; St. Moritz, Switzerland', 'Christmas where it is warm, New Year where it snows', '2026-11-02', '2026-12-01', 'Largely booked in this market; the posts sell what is left and open 2027.'),
  ('Festive season 2027', '2027-12-20', '2028-01-05', true, 'St. Barth, France; Maldives; Dubai, United Arab Emirates; Courchevel, France; Gstaad, Switzerland; St. Moritz, Switzerland', 'Christmas where it is warm, New Year where it snows', '2027-09-20', '2027-10-25', null),
  ('St. Moritz winter: Snow Polo and White Turf', '2027-01-29', '2027-02-21', false, 'St. Moritz, Switzerland', 'Polo on a frozen lake, a chalet above it', '2026-11-10', '2027-01-05', 'Snow Polo ~29-31 Jan; White Turf Sundays 7, 14, 21 Feb.'),
  ('Carnival', '2027-02-05', '2027-02-10', false, 'Rio de Janeiro, Brazil; Trancoso, Brazil', 'Rio for the parade, Trancoso to recover', '2026-11-15', '2027-01-08', null),
  ('Super Bowl LXI', '2027-02-14', '2027-02-14', true, 'Los Angeles, California; Malibu, California', 'Game week in a Malibu house, the city behind you', '2026-11-20', '2027-01-15', null),
  ('Milan Fashion Week', '2027-02-23', '2027-03-01', false, 'Milan, Italy; Lake Como, Italy', 'Shows in Milan, nights on the lake', '2026-12-01', '2027-01-25', null),
  ('Easter', '2027-03-26', '2027-04-05', true, 'Marbella, Spain; Mallorca, Spain; Maldives', 'The first Mediterranean week of the year', '2027-01-10', '2027-03-01', null),
  ('Coachella', '2027-04-09', '2027-04-18', false, 'Palm Springs, California', 'A desert house with a pool, ten minutes from the polo grounds', '2027-01-20', '2027-03-10', 'Two weekends.'),
  ('The Masters', '2027-04-08', '2027-04-11', false, 'Miami, Florida; Nashville, Tennessee', 'Fly in for the Sunday, stay the week somewhere better', '2027-01-20', '2027-03-10', 'No house of ours in Augusta; sell the week around it.'),
  ('Monte-Carlo Masters tennis', '2027-04-10', '2027-04-18', false, 'Monaco; Saint Jean Cap Ferrat, France', 'Clay by the sea, before the Riviera fills up', '2027-01-25', '2027-03-15', null),
  ('F1 Miami Grand Prix', '2027-05-07', '2027-05-09', false, 'Miami, Florida', 'Race weekend on the water, not in a hotel', '2027-02-15', '2027-04-05', null),
  ('Cannes Film Festival', '2027-05-11', '2027-05-22', false, 'Cannes, France; Saint Jean Cap Ferrat, France; St-Tropez, France', 'Twelve days of Cannes, a villa with its own gate', '2027-02-20', '2027-04-12', null),
  ('Monaco Grand Prix', '2027-05-28', '2027-05-30', false, 'Monaco; Saint Jean Cap Ferrat, France; Cannes, France', 'The race from a terrace, the harbour from a boat', '2027-03-01', '2027-04-20', 'Date to fix when the 2027 calendar is published; may be early June.'),
  ('Ibiza and Mykonos opening', '2027-05-22', '2027-06-30', false, 'Ibiza, Spain; Mykonos, Greece', 'The islands before August, quieter and better', '2027-03-01', '2027-04-25', null),
  ('Wimbledon', '2027-06-28', '2027-07-11', false, 'London, United Kingdom', 'Centre Court by day, a London house by night', '2027-04-10', '2027-06-01', null),
  ('America''s Cup, Naples', '2027-07-01', '2027-07-31', false, 'Amalfi Coast, Italy; Capri, Italy', 'The Cup in the bay, your villa on the coast', '2027-04-01', '2027-05-20', 'Dates to confirm when announced.'),
  ('Monterey Car Week and Pebble Beach', '2027-08-12', '2027-08-15', false, 'Santa Barbara, California; Napa Sonoma, California', 'The cars on the lawn, the week in wine country', '2027-05-20', '2027-07-15', null),
  ('US Open tennis', '2027-08-30', '2027-09-12', false, 'New York City, New York; Hamptons, New York', 'The Open and the last of the Hamptons summer', '2027-06-10', '2027-08-01', null),
  ('Venice Film Festival', '2027-09-01', '2027-09-11', false, 'Lake Como, Italy; Cortina d''Ampezzo, Italy', 'Venice by water taxi, home to the lake', '2027-06-10', '2027-08-01', 'No house of ours in Venice.'),
  ('Cannes Yachting Festival', '2027-09-07', '2027-09-12', false, 'Cannes, France; St-Tropez, France', 'See the boats, then rent one with the house', '2027-06-15', '2027-08-05', null),
  ('Fashion weeks: New York, London, Milan, Paris', '2027-09-09', '2027-10-05', false, 'New York City, New York; London, United Kingdom; Milan, Italy; Paris, France', 'Four cities, four weeks, one call to us', '2027-06-20', '2027-08-10', null),
  ('F1 United States Grand Prix', '2027-10-22', '2027-10-24', false, 'Austin, Texas', 'Austin for the race and the music', '2027-08-01', '2027-09-20', null),
  ('F1 Mexico City Grand Prix', '2027-10-29', '2027-10-31', false, 'Punta Mita, Mexico; Cabo, Mexico', 'The race in the city, the week on the Pacific', '2027-08-05', '2027-09-25', null),
  ('Caribbean season opens', '2027-11-15', '2027-12-15', true, 'Bahamas; Turks and Caicos; Anguilla; St. Barth, France', 'Winter is for the Caribbean. Book before the festive rush', '2027-08-20', '2027-10-10', null)
on conflict (lower(title)) do nothing;

select count(*) as events_in_the_calendar, min(starts_on) as first, max(starts_on) as last from marketing_events;
