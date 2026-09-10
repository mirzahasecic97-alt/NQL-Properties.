-- ---------------------------------------------------------------------------
-- NQL Properties — a request carries the house
--
-- An agency asking to be introduced puts a house forward. The buyer is shown
-- that house and says yes or no to it before any contact details move. Two
-- columns, both additive: nothing is dropped, no view or policy changes.
--
-- Paste into the Supabase SQL editor and run. Safe to run twice.
-- ---------------------------------------------------------------------------

alter table partner_interest
  add column if not exists offer_id uuid references partner_offers(id) on delete set null;

alter table partner_offers
  add column if not exists photo_url text;

select count(*) filter (where offer_id is not null) as requests_with_a_house,
       count(*)                                     as requests
  from partner_interest;
