-- ---------------------------------------------------------------------------
-- NQL Properties — partner agencies, from the Agency Agreements sheet
--
-- Run after partners.sql and grants.sql. Safe to re-run: agencies are matched
-- on name, so running twice updates rather than duplicates.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- One column the sheet has and the table did not.
-- --------------------------------------------------------------------------

alter table partners add column if not exists agreement_signed boolean not null default false;

-- Matching on name is what makes this re-runnable.
create unique index if not exists partners_name_key on partners (lower(name));

-- --------------------------------------------------------------------------
-- The agencies.
--
-- country is set only where it is certain from the record itself — an Srl is
-- an Italian company, Romolini and Casa Tuscany are Tuscan, Evergreen is the
-- Habitat developer in North Cyprus. The rest are left blank rather than
-- guessed at.
-- --------------------------------------------------------------------------

insert into partners (name, country, agreement_signed, status, notes) values
  ('Luxury Solutions Srl',  'Italy',        true,  'active', null),
  ('Stephanie Valente',      null,          true,  'active', 'Sheet spells the agency "Stehpanie Valente".'),
  ('Engel & Voelkers',       null,          true,  'active', 'Contact email truncated in the source sheet — domain needs confirming.'),
  ('Romolini',              'Italy',        true,  'active', 'Also the source of the Capraia wine estate listing.'),
  ('Building Heritage',      null,          true,  'active', null),
  ('Porto Servo',            null,          false, 'active', 'Agreement not recorded as signed.'),
  ('Serimm / Knight Frank',  null,          false, 'active', 'No contact recorded yet.'),
  ('Casa Tuscany',          'Italy',        false, 'active', 'No contact recorded yet.'),
  ('Evergreen Group',       'North Cyprus', true,  'active', 'Developer behind Habitat Premium and Habitat Standard.'),
  ('Barnes International',   null,          false, 'active', 'Agreement not signed.'),
  ('Rimmo',                  null,          true,  'active', null)
on conflict (lower(name)) do update set
  agreement_signed = excluded.agreement_signed,
  country          = coalesce(excluded.country, partners.country),
  notes            = coalesce(excluded.notes, partners.notes);

-- --------------------------------------------------------------------------
-- Their people. Where the sheet holds an email in the name column, it is
-- recorded as an email and the name left for you to fill in.
-- --------------------------------------------------------------------------

insert into partner_contacts (partner_id, name, email, is_primary)
select p.id, v.contact_name, v.contact_email, true
from (values
  ('Luxury Solutions Srl',  'Mirko Delfini',   null),
  ('Stephanie Valente',     'Stephanie Valente', 'stephanie.valente85@gmail.com'),
  ('Engel & Voelkers',      'Francesca Boghi', null),
  ('Romolini',              'Danili Romolini', null),
  ('Building Heritage',     'Andrew Morley',   null),
  ('Porto Servo',           'Paulo Costi',     null),
  ('Evergreen Group',       'Morvardi',        null),
  ('Barnes International',  'Matteo',          null),
  ('Rimmo',                 'Rupert',          null)
) as v(agency, contact_name, contact_email)
join partners p on lower(p.name) = lower(v.agency)
where not exists (
  select 1 from partner_contacts c
  where c.partner_id = p.id and c.is_primary
);
