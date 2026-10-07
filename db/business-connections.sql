-- ---------------------------------------------------------------------------
-- NQL Group — business connections
--
-- The map of the business: every line, every place, which partner covers
-- it, who at NQL owns the relationship, and what is still missing before
-- we can introduce clients. The CRM's "Business connections" tab reads and
-- edits this table; owners, admins and management see it, sales do not.
--
-- SAFE BY CONSTRUCTION: creates one table and its policies, seeds by upsert
-- (an edited row is never overwritten). Drops nothing. Safe to run twice.
-- Paste the whole file into the Supabase SQL editor and run it.
-- ---------------------------------------------------------------------------

create table if not exists business_connections (
  id           text primary key,
  line         text not null check (line in ('buy','invest','rent','sell','exp','ops')),
  sort         integer not null default 0,
  place        text not null default '',
  role         text not null default '',
  partner      text not null default '',
  owner        text not null default '',
  note         text not null default '',
  contract     text not null default '',
  pct          text not null default '',
  person       text not null default '',
  phone        text not null default '',
  email        text not null default '',
  next_step    text not null default '',
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);

alter table business_connections enable row level security;
drop policy if exists "staff read connections"   on business_connections;
drop policy if exists "staff manage connections" on business_connections;
create policy "staff read connections"
  on business_connections for select to authenticated using (public.is_nql_staff());
create policy "staff manage connections"
  on business_connections for all to authenticated
  using (public.is_nql_staff()) with check (public.is_nql_staff());
grant select, insert, update, delete on business_connections to authenticated;

-- ------------------------------------------------------------- the seed
-- Status as of 7 October 2026. Insert only: rows already there keep what
-- the team has typed into them.
insert into business_connections (id, line, sort, place, role, partner, owner, note, contract, pct) values
  ('buy-tus', 'buy', 0, 'Italy · Tuscany', 'Houses for sale; agencies see our buyer briefs on the portal', 'Partner agencies (portal)', 'Mirza', 'Chianti, Val d''Orcia, Arezzo, Pisa, the coast. Renewal dates in the CRM.', 'Signed', ''),
  ('buy-umb', 'buy', 5, 'Italy · Umbria', 'Houses for sale; agencies see our buyer briefs on the portal', 'Partner agencies (portal)', 'Mirza', 'Todi, Umbertide, Assisi, Perugia. Two logo permissions still open.', 'Signed', ''),
  ('buy-laz', 'buy', 10, 'Italy · Lazio', 'Buy-side agency on portal terms; Rome and the Castelli', '', 'Mirza', 'In talks, unconfirmed.', '', ''),
  ('buy-sar', 'buy', 15, 'Italy · Sardinia', 'Sales, Porto Cervo and the Costa Smeralda', 'Porto Cervo agency', 'Mirza', 'Add Sardinia as a destination when the first house is ready.', 'Signed', ''),
  ('buy-cam', 'buy', 20, 'Italy · Campania', 'Buy-side agency on portal terms; Amalfi Coast', '', 'Mirza', 'One listing on the site; no agency agreement yet.', '', ''),
  ('buy-sic', 'buy', 25, 'Italy · Sicily', 'Buy-side agency on portal terms', '', 'Mirza', 'One listing on the site; no agency agreement yet.', '', ''),
  ('buy-lom', 'buy', 30, 'Italy · Lombardy', 'Buy-side agency on portal terms; Milan and the lakes', '', 'Mirza', 'Nobody yet.', '', ''),
  ('buy-lig', 'buy', 35, 'Italy · Liguria', 'Buy-side agency on portal terms; the Riviera', '', 'Mirza', 'Nobody yet.', '', ''),
  ('inv-cy', 'invest', 70, 'North Cyprus', 'Investment project, presale, airline-miles offer', 'Habitat Premium', 'Jón', 'Investment door only; not on the destinations list.', 'Signed', ''),
  ('inv-dxb', 'invest', 80, 'Dubai', 'Investment project for the investment page', '', 'Jón', 'Find a project to stand beside Habitat.', '', ''),
  ('inv-mar', 'invest', 90, 'Marbella', 'Investment project for the investment page', '', 'Oskar', 'Find a project to stand beside Habitat.', '', ''),
  ('vil-it', 'rent', 100, 'Tuscany, Florence - villas', 'Co-ownership shares; rentals when owners release dates', 'BorgoCollection', 'Mirza', 'Terms agreed (4% / 15%), nothing signed. Need photo permission, weekly rates, dates from May.', 'Agreed, not signed', '4% shares · 15% rentals'),
  ('vil-mar', 'rent', 110, 'Marbella - villas', 'Coast villas €5k-45k a week via Spanish colleague', 'Spanish contact (WhatsApp)', 'Oskar', 'Get direct line to the Spanish colleague; rates May-Oct; referral agreement.', 'Not signed', ''),
  ('vil-rom', 'rent', 120, 'Rome - villas', 'Agency or owner-manager, 10+ houses', '', 'Mirza', 'Nobody yet.', '', ''),
  ('vil-par', 'rent', 130, 'Paris - villas', 'Agency or owner-manager, 10+ houses', '', 'Oskar', 'Nobody yet.', '', ''),
  ('vil-ibz', 'rent', 140, 'Ibiza - villas', 'Agency or owner-manager, 10+ houses', '', 'Oskar', 'Nobody yet.', '', ''),
  ('vil-st', 'rent', 150, 'Saint-Tropez - villas', 'Agency or owner-manager, 10+ houses', '', 'Oskar', 'Nobody yet.', '', ''),
  ('vil-dxb', 'rent', 160, 'Dubai - villas', 'Agency or owner-manager, 10+ houses', '', 'Jón', 'Nobody yet.', '', ''),
  ('yac-med', 'rent', 170, 'Mediterranean - yachts', 'Charter broker: Marbella, Ibiza, Saint-Tropez', '', 'Oskar', 'Nobody yet.', '', ''),
  ('yac-dxb', 'rent', 180, 'Dubai - yachts', 'Charter broker', '', 'Jón', 'Nobody yet.', '', ''),
  ('car-eu', 'rent', 190, 'Europe - cars', 'Premium rental with delivery to the house', '', 'Eyþór', 'Nobody yet.', '', ''),
  ('car-dxb', 'rent', 200, 'Dubai - cars', 'Premium rental with delivery', '', 'Jón', 'Nobody yet.', '', ''),
  ('sel-it', 'sell', 210, 'Italy', 'Film and photo partner for listings', 'Italy film and photo partner', 'Mirza', 'Name the partner and confirm rates.', '', ''),
  ('sel-es', 'sell', 220, 'Spain', 'Film and photo partner for listings', '', 'Oskar', 'No local film partner yet.', '', ''),
  ('sel-fr', 'sell', 230, 'France', 'Film and photo partner for listings', '', 'Oskar', 'No local film partner yet.', '', ''),
  ('sel-dxb', 'sell', 240, 'Dubai', 'Film and photo partner for listings', '', 'Jón', 'No local film partner yet.', '', ''),
  ('exp-it', 'exp', 250, 'Italy', 'Concierge: dining, nights, chefs, wellness', '', 'Mirza', 'Nobody yet, or one network covering several.', '', ''),
  ('exp-es', 'exp', 260, 'Marbella, Ibiza', 'Concierge: dining, nights, chefs, wellness', '', 'Oskar', 'Nobody yet.', '', ''),
  ('exp-fr', 'exp', 270, 'Paris, Saint-Tropez', 'Concierge: dining, nights, chefs, wellness', '', 'Oskar', 'Nobody yet.', '', ''),
  ('exp-dxb', 'exp', 280, 'Dubai', 'Concierge: dining, nights, chefs, wellness', '', 'Jón', 'Nobody yet.', '', ''),
  ('ops-dem', 'ops', 290, 'April - October', 'Partner with many clients in season; sends them to us', 'Demand partner', 'Jón', 'Verbal only: fee per booking; how clients are registered as ours.', 'Not signed', ''),
  ('ops-gw', 'ops', 300, 'nqlgroup.com mail', 'Mail on the teams existing account', 'Google Workspace', 'Eyþór', 'Add alias domain, switch MX, cancel GoDaddy mailbox.', '', ''),
  ('ops-gd', 'ops', 310, 'Domain and DNS', 'Domain registrar; mailbox to cancel', 'GoDaddy', 'Eyþór', 'Switch MX to Google, then cancel mailbox.', '', ''),
  ('ops-fs', 'ops', 320, 'Site forms', 'Four forms deliver to info@nqlgroup.com', 'Formspree', 'Eyþór', 'Confirm the verification mail.', '', '')
on conflict (id) do nothing;
