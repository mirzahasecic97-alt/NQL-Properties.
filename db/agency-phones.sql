-- ---------------------------------------------------------------------------
-- NQL Properties — the phone numbers for the agencies
--
-- Each of these is a PERSON at an agency, so each becomes a contact on that
-- agency rather than the agency's own switchboard number. Where the agency
-- has no number of its own yet, it gets this one too, since a partner card
-- with no way to ring anybody is not much of a card.
--
-- Agencies are matched on a fragment of their name, because I do not know how
-- each is spelt in your table. Anything that matches nothing, or matches more
-- than one, is named at the end rather than guessed at.
--
-- Read the two results before trusting it. If a row did not match, put the
-- agency's exact name in the `agency` column below and run it again.
--
-- Run in the Supabase SQL editor. Safe to re-run: a contact already there
-- keeps its number rather than gaining a second row.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  pid uuid;
  hits int;
begin
  for r in
    select * from (values
      -- agency name fragment      person                       number
      ('Romolini',                 'Romolini Christie''s',      '+39 0575 788948'),
      ('Delfini',                  'Mirko Delfini',             '+39 338 848 0845'),
      ('Rommo',                    'Rupert',                    '+39 345 701 4309'),
      ('Barnes',                   'Matteo',                    '+39 342 155 4421'),
      ('Evergreen',                'Morvarid Naseri',           '+90 546 997 03 44'),
      ('Morley',                   'Andrew Morley',             '+1 989 513 7309')
    ) as t(agency, person, phone)
  loop
    select count(*) into hits from partners where name ilike '%' || r.agency || '%';

    if hits = 0 then
      raise notice 'No agency matched "%". % is not filed anywhere.', r.agency, r.person;
      continue;
    elsif hits > 1 then
      raise notice 'More than one agency matches "%". Use the exact name for %.', r.agency, r.person;
      continue;
    end if;

    select id into pid from partners where name ilike '%' || r.agency || '%';

    -- The person. Matched on the name so re-running updates rather than
    -- adding a second row for the same human.
    if exists (select 1 from partner_contacts where partner_id = pid and lower(name) = lower(r.person)) then
      update partner_contacts
         set phone = r.phone
       where partner_id = pid and lower(name) = lower(r.person);
    else
      insert into partner_contacts (partner_id, name, phone, is_primary)
      values (
        pid, r.person, r.phone,
        -- The first person on an agency is its primary contact. A second one
        -- is not, because the index allows only one and this should not fail
        -- on the sixth row.
        not exists (select 1 from partner_contacts where partner_id = pid and is_primary)
      );
    end if;

    -- And the agency's own number, only if it has none.
    update partners
       set phone = r.phone
     where id = pid and (phone is null or trim(phone) = '');

    raise notice '% filed under %.', r.person, (select name from partners where id = pid);
  end loop;
end $$;


-- Who each agency now has, and how to reach them.
select p.name as agency,
       p.phone as agency_number,
       c.name  as person,
       c.phone as their_number,
       c.is_primary
  from partners p
  left join partner_contacts c on c.partner_id = p.id
 order by p.name, c.is_primary desc nulls last, c.name;

-- Agencies still with nobody to ring.
select name as no_contact_and_no_number
  from partners p
 where (p.phone is null or trim(p.phone) = '')
   and not exists (
     select 1 from partner_contacts c
      where c.partner_id = p.id and c.phone is not null
   )
 order by name;
