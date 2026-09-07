-- ---------------------------------------------------------------------------
-- NQL Properties, who handles which agency
--
-- Records that Guy Smit looks after Evergreen Group. Admins set it; everyone
-- can read it, so a lead can show whose agency it came through.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists partner_staff (
  partner_id uuid not null references partners(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id) on delete set null,
  primary key (partner_id, user_id)
);

create index if not exists partner_staff_user_idx on partner_staff (user_id);

alter table partner_staff enable row level security;

drop policy if exists "read partner staff"  on partner_staff;
drop policy if exists "write partner staff" on partner_staff;

-- Readable by everyone signed in: a salesperson should be able to see that an
-- agency is theirs. Writable by anyone signed in for now, because the admin
-- and sales split was taken out; tighten this to is_admin() when it returns.
create policy "read partner staff"  on partner_staff for select to authenticated using (true);
create policy "write partner staff" on partner_staff for all    to authenticated using (true) with check (true);

grant select, insert, update, delete on partner_staff to authenticated;
grant select, insert, update, delete on partner_staff to service_role;

select p.name as agency, u.email as handled_by
from partner_staff ps
join partners p on p.id = ps.partner_id
join auth.users u on u.id = ps.user_id
order by p.name;
