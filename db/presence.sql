-- ---------------------------------------------------------------------------
-- NQL Properties CRM — who is online
--
-- One row per person, holding the last time their browser said it was there.
-- The CRM writes its own row every thirty seconds, on the same timer that
-- already fetches new leads, and anyone whose row is fresher than two minutes
-- is shown as online.
--
-- A heartbeat rather than a websocket: it needs no library, no build step and
-- no second connection, which is how the rest of this CRM works.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

create table if not exists presence (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz not null default now()
);

comment on table presence is
  'Last time each person had the CRM open and visible. Written by the browser every 30s.';

alter table presence enable row level security;

-- Everyone signed in can see who else is here.
drop policy if exists "staff read presence" on presence;
create policy "staff read presence"
  on presence for select to authenticated using (true);

-- But nobody can claim to be someone else. Each of these pins the row to the
-- account making the request, so the worst anyone can do is lie about
-- themselves.
drop policy if exists "staff start presence" on presence;
create policy "staff start presence"
  on presence for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "staff beat presence" on presence;
create policy "staff beat presence"
  on presence for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "staff clear presence" on presence;
create policy "staff clear presence"
  on presence for delete to authenticated using (user_id = auth.uid());

-- Policies and grants are two separate gates. Both have to be open.
grant select, insert, update, delete on presence to authenticated;

select count(*) as rows_now from presence;
