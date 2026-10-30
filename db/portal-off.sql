-- The agency portal is switched off. Mirza, 30 Oct 2026: "remove the portal
-- for agencies, we dont need that anymore." Run in the Supabase SQL editor.
-- Safe to run twice.
--
-- What goes: the agency sign-ins, the anonymised board they signed into, the
-- introduction requests they made through it and the houses pitched there.
-- What stays: the agencies themselves, their contacts, countries and
-- agreements, and lead_partners with its consent trail, which records the
-- introductions NQL itself has made.

-- Agency accounts can no longer sign in. The test account goes with them.
delete from auth.users
 where id in (select user_id from partner_users)
    or lower(email) = 'mirzatest@gmail.com';

drop view if exists partner_users_admin;
drop view if exists partner_board;
drop view if exists partner_board_new;
drop table if exists partner_interest cascade;
drop table if exists partner_offers cascade;
drop table if exists partner_users cascade;

select (select count(*) from partners)      as agencies_kept,
       (select count(*) from lead_partners) as introductions_kept;
