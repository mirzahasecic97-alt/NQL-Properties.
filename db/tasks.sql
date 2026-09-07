-- ---------------------------------------------------------------------------
-- NQL Properties, shared task list
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.
--
-- Separate from lead_reminders on purpose: a reminder belongs to one lead and
-- dies with it. A task is work somebody owes somebody else, and most of it has
-- nothing to do with a particular lead.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,

  title       text not null,
  detail      text,

  -- who owes it. null means nobody has picked it up yet, which is a state
  -- worth being able to see rather than hiding behind a default.
  assigned_to uuid references auth.users(id) on delete set null,

  due_on      date,
  priority    text not null default 'normal',

  done        boolean not null default false,
  done_at     timestamptz,
  done_by     uuid references auth.users(id) on delete set null,

  -- optional: a task that did come out of a lead keeps the thread
  lead_id     uuid references leads(id) on delete set null
);

create index if not exists tasks_assigned_idx on tasks (assigned_to) where not done;
create index if not exists tasks_due_idx      on tasks (due_on)      where not done;
create index if not exists tasks_lead_idx     on tasks (lead_id);

-- --------------------------------------------------------------------------
-- Access: any signed-in member of staff sees and edits the whole board.
-- A three person team does not need per-row privacy, and hiding tasks from
-- each other is the opposite of what this is for.
-- --------------------------------------------------------------------------

alter table tasks enable row level security;

drop policy if exists "staff read tasks"   on tasks;
drop policy if exists "staff add tasks"    on tasks;
drop policy if exists "staff edit tasks"   on tasks;
drop policy if exists "staff delete tasks" on tasks;

create policy "staff read tasks"   on tasks for select to authenticated using (true);
create policy "staff add tasks"    on tasks for insert to authenticated with check (true);
create policy "staff edit tasks"   on tasks for update to authenticated using (true) with check (true);
create policy "staff delete tasks" on tasks for delete to authenticated using (true);

-- Privileges are a separate gate from the policies above; both must be open.
grant select, insert, update, delete on tasks to authenticated;
grant select, insert, update, delete on tasks to service_role;

select count(*) as tasks_now from tasks;
