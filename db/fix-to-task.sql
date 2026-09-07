-- ---------------------------------------------------------------------------
-- NQL Properties — a fix report becomes a task
--
-- Every report raises a task assigned to the owner, so it turns up on the
-- board that already has a count in the header rather than waiting to be
-- found in Control.
--
-- A database trigger rather than a second write from the browser, for two
-- reasons. An agency user is not staff and has no permission to write to
-- tasks at all, so the portal could not do it. And a client that has to
-- remember eventually forgets.
--
-- Run after db/fix-requests.sql and db/tasks.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.tasks') is null then
    raise exception 'tasks does not exist. Run db/tasks.sql first.';
  end if;
  if to_regclass('public.fix_requests') is null then
    raise exception 'fix_requests does not exist. Run db/fix-requests.sql first.';
  end if;
end $$;

-- The link, so closing the report can close the task and the other way round.
alter table fix_requests add column if not exists task_id uuid
  references tasks(id) on delete set null;


-- --------------------------------------------------------------------------
-- Who owns the CRM. The earliest owner if there is somehow more than one, so
-- the answer does not change from one call to the next.
-- --------------------------------------------------------------------------

create or replace function public.crm_owner()
returns uuid language sql stable security definer set search_path = public as $$
  select user_id from nql_staff
   where role = 'owner'
   order by added_at
   limit 1;
$$;


-- --------------------------------------------------------------------------
-- The task
--
-- security definer so it can write to tasks whoever filed the report. An
-- agency user has no rights on that table and must not be given any.
-- --------------------------------------------------------------------------

create or replace function public.fix_request_to_task()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner_id uuid;
  new_task uuid;
  who text;
begin
  owner_id := public.crm_owner();
  if owner_id is null then
    -- No owner means nobody to assign it to. The report is still saved; it
    -- simply does not raise a task, which is better than failing the insert
    -- and losing what somebody wrote.
    return new;
  end if;

  who := coalesce(new.from_name, new.from_email, 'Somebody');
  if new.from_where = 'portal' then
    who := who || ' at ' || coalesce(new.agency, 'an agency');
  end if;

  insert into tasks (title, detail, assigned_to, created_by, priority)
  values (
    left('Fix asked for by ' || who, 200),
    new.body,
    owner_id,
    new.created_by,
    'normal'
  )
  returning id into new_task;

  update fix_requests set task_id = new_task where id = new.id;
  return new;
end;
$$;

drop trigger if exists fix_requests_make_task on fix_requests;
create trigger fix_requests_make_task
  after insert on fix_requests
  for each row execute function public.fix_request_to_task();


-- --------------------------------------------------------------------------
-- Closing one closes the other, in both directions.
--
-- Two boards showing different answers to the same question is worse than
-- one board, so the report and its task are kept in step.
-- --------------------------------------------------------------------------

create or replace function public.fix_request_status_to_task()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.task_id is null or new.status is not distinct from old.status then
    return new;
  end if;

  if new.status in ('done', 'declined') then
    update tasks
       set done = true, done_at = now(), done_by = auth.uid()
     where id = new.task_id and done = false;
  else
    update tasks
       set done = false, done_at = null, done_by = null
     where id = new.task_id and done = true;
  end if;

  return new;
end;
$$;

drop trigger if exists fix_requests_status_to_task on fix_requests;
create trigger fix_requests_status_to_task
  after update of status on fix_requests
  for each row execute function public.fix_request_status_to_task();


-- Marking the task done closes the report, so somebody working from the task
-- board does not leave the report open behind them.
create or replace function public.task_done_to_fix_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.done is not distinct from old.done then return new; end if;

  update fix_requests
     set status = case when new.done then 'done' else 'open' end,
         decided_at = now(),
         decided_by = auth.uid()
   where task_id = new.id
     and status <> case when new.done then 'done' else 'open' end;

  return new;
end;
$$;

drop trigger if exists tasks_done_to_fix_request on tasks;
create trigger tasks_done_to_fix_request
  after update of done on tasks
  for each row execute function public.task_done_to_fix_request();


-- --------------------------------------------------------------------------
-- Existing reports never raised a task. Give them one.
-- --------------------------------------------------------------------------

do $$
declare
  r record;
  owner_id uuid := public.crm_owner();
  new_task uuid;
begin
  if owner_id is null then
    raise notice 'No owner is set, so nothing was assigned. Run db/owner-role.sql.';
    return;
  end if;

  for r in select * from fix_requests where task_id is null and status = 'open'
  loop
    insert into tasks (title, detail, assigned_to, created_by, priority)
    values (left('Fix asked for by ' || coalesce(r.from_name, 'somebody'), 200),
            r.body, owner_id, r.created_by, 'normal')
    returning id into new_task;
    update fix_requests set task_id = new_task where id = r.id;
  end loop;
end $$;


select f.created_at, f.from_name, f.status, t.title, t.done
  from fix_requests f left join tasks t on t.id = f.task_id
 order by f.created_at desc;
