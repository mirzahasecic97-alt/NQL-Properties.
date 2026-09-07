-- ---------------------------------------------------------------------------
-- NQL Properties CRM — lead numbers
--
-- Every lead gets a reference like NQL-014, so a lead can be named in an
-- email, on the phone or in a spreadsheet without spelling out a person's
-- name and address.
--
-- This does four things:
--   1. adds the column
--   2. writes the 32 numbers that already existed, matched on name
--   3. numbers every other lead from 033 up, oldest first
--   4. hands out numbers automatically from now on
--
-- Safe to re-run: it never overwrites a number that is already set.
-- Run it in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

alter table leads add column if not exists lead_no text;

comment on column leads.lead_no is
  'Human reference for the lead, NQL-001 upward. Set once and never reused.';

-- Two leads must never share a number. Partial, so rows still waiting for one
-- do not collide on null.
create unique index if not exists leads_lead_no_key
  on leads (lead_no) where lead_no is not null;


-- --------------------------------------------------------------------------
-- 1. The numbers that already existed.
--
-- Matched on the full name with case and spacing ignored, because "Per Olav
-- Karlsen " and "per olav karlsen" are the same person. Accents and Nordic
-- letters must still match exactly; anything that does not match is listed at
-- the end of this script rather than guessed at.
-- --------------------------------------------------------------------------

-- Not "on commit drop": if the SQL editor commits each statement on its own,
-- the table would be gone before the next one runs. It disappears with the
-- session either way.
drop table if exists known_numbers;
create temporary table known_numbers (lead_no text, full_name text);

insert into known_numbers (lead_no, full_name) values
  ('NQL-001', 'Mark Urup Svendsen'),
  ('NQL-002', 'Niels Petter Markussen'),
  ('NQL-003', 'Jon Alexander Kristiansen'),
  ('NQL-004', 'Sophie Przybylski'),
  ('NQL-005', 'Per Olav Karlsen'),
  ('NQL-006', 'Frode Ramstad'),
  ('NQL-007', 'Bente Gjelseth Wik Bergsvik'),
  ('NQL-008', 'Einar Harbo'),
  ('NQL-009', 'Masoud Shonjani'),
  ('NQL-010', 'Tobias Lerskov'),
  ('NQL-011', 'Frank Poulsen'),
  ('NQL-012', 'Eva Bostad Borg'),
  ('NQL-013', 'Per Frode Osvoll'),
  ('NQL-014', 'Ove Bech Holdensen'),
  ('NQL-015', 'Jeppe Rasmussen'),
  ('NQL-016', 'Brede Hemma'),
  ('NQL-017', 'Zdenek Kovarik'),
  ('NQL-018', 'Reiulf Framstad'),
  ('NQL-019', 'Nebojsa Ljusic'),
  ('NQL-020', 'Albert Collett'),
  ('NQL-021', 'Michael Wilson'),
  ('NQL-022', 'Melissa Amalia Lundstrøm'),
  ('NQL-023', 'Tulio Luvison Carvalho'),
  ('NQL-024', 'Jakob Kehler'),
  ('NQL-025', 'Kjell Arne'),
  ('NQL-026', 'Michael Høgholm Pedersen'),
  ('NQL-027', 'Marit Anne Nilsdatter Eira'),
  ('NQL-028', 'Michael Wulff'),
  ('NQL-029', 'Anders Evenrud'),
  ('NQL-030', 'Farhad Ramezani'),
  ('NQL-031', 'Wiggo Andersen'),
  ('NQL-032', 'Jay');

-- One row per lead with its name reduced to something comparable.
drop view if exists lead_names;
create temporary view lead_names as
  select
    id,
    created_at,
    lead_no,
    lower(regexp_replace(
      trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')),
      '\s+', ' ', 'g'
    )) as norm
  from leads;

-- Where a name appears twice, the number goes to the row that arrived first
-- and the later one is treated as a separate lead. Numbers are a record of
-- who was first, not a merge.
with target as (
  select distinct on (n.norm)
         n.id, k.lead_no
    from known_numbers k
    join lead_names n
      on n.norm = lower(regexp_replace(trim(k.full_name), '\s+', ' ', 'g'))
   where n.lead_no is null
   order by n.norm, n.created_at
)
update leads l
   set lead_no = t.lead_no
  from target t
 where l.id = t.id
   and l.lead_no is null;


-- --------------------------------------------------------------------------
-- 2. Everyone else, oldest first, starting after the highest number in use.
-- --------------------------------------------------------------------------

with numbered as (
  select id,
         row_number() over (order by created_at, id) as n
    from leads
   where lead_no is null
),
start as (
  select coalesce(max(nullif(regexp_replace(lead_no, '\D', '', 'g'), '')::int), 0) as high
    from leads
)
update leads l
   set lead_no = 'NQL-' || lpad((start.high + numbered.n)::text, 3, '0')
  from numbered, start
 where l.id = numbered.id;


-- --------------------------------------------------------------------------
-- 3. From now on, automatically.
--
-- A sequence rather than max()+1: two leads arriving in the same second must
-- not be handed the same number.
-- --------------------------------------------------------------------------

create sequence if not exists lead_no_seq;

select setval(
  'lead_no_seq',
  greatest(
    coalesce((select max(nullif(regexp_replace(lead_no, '\D', '', 'g'), '')::int) from leads), 0),
    1
  )
);

-- The loop matters. If a number is ever set by hand ahead of the sequence,
-- say NQL-100 on a lead that arrived today, the sequence would eventually
-- count up to it, collide with the unique index and the insert would fail.
-- A failed insert here is a lost enquiry, so step over anything taken rather
-- than refusing the lead.
create or replace function set_lead_no() returns trigger as $$
declare
  candidate text;
begin
  if new.lead_no is not null then
    return new;
  end if;

  loop
    candidate := 'NQL-' || lpad(nextval('lead_no_seq')::text, 3, '0');
    exit when not exists (select 1 from leads where lead_no = candidate);
  end loop;

  new.lead_no := candidate;
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_lead_no on leads;
create trigger leads_set_lead_no
  before insert on leads
  for each row execute function set_lead_no();

-- The trigger runs as whoever did the insert, so both roles that can file a
-- lead need to be able to draw from the sequence.
grant usage on sequence lead_no_seq to authenticated, service_role;


-- --------------------------------------------------------------------------
-- 4. What happened.
-- --------------------------------------------------------------------------

-- Any of the 32 that could not be matched to a lead. These are people who are
-- not in the CRM, or whose name is spelled differently there. Nothing to fix
-- unless you expected to see them.
select k.lead_no, k.full_name as not_found_in_crm
  from known_numbers k
 where not exists (
   select 1 from leads l
    where lower(regexp_replace(
            trim(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')),
            '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(k.full_name), '\s+', ' ', 'g'))
 )
 order by k.lead_no;

select count(*) as leads_total,
       count(lead_no) as numbered,
       min(lead_no) as lowest,
       max(lead_no) as highest
  from leads;
