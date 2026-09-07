-- ---------------------------------------------------------------------------
-- Replaces the numbering function from db/lead-numbers.sql. Run this on its
-- own if you have already run that script; it is included there too, so a
-- fresh run of the full file does not need this.
-- ---------------------------------------------------------------------------

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

-- The trigger already points at this function, so nothing else needs changing.
