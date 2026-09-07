-- ---------------------------------------------------------------------------
-- NQL Properties — a way to say what is wrong with this
--
-- Anybody who uses the CRM or the partner portal can write down something
-- that should be fixed, and the owner sees all of them in one place and can
-- answer.
--
-- The people using a thing every day know what is wrong with it, and the
-- alternative to a box like this is that they tell nobody and work around it.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists fix_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,

  -- Copied in at the time of writing rather than joined later. An account can
  -- be removed, and a report that loses its author becomes an anonymous
  -- complaint nobody can follow up.
  from_name   text,
  from_email  text,
  from_where  text not null default 'crm' check (from_where in ('crm', 'portal')),
  agency      text,

  body        text not null,

  status      text not null default 'open'
              check (status in ('open', 'doing', 'done', 'declined')),
  reply       text,
  decided_at  timestamptz,
  decided_by  uuid references auth.users(id) on delete set null
);

create index if not exists fix_requests_status_idx on fix_requests (status, created_at desc);
create index if not exists fix_requests_author_idx on fix_requests (created_by);

comment on table fix_requests is
  'Things the people using the CRM and the portal say should be fixed. Read and answered by the owner.';

alter table fix_requests enable row level security;

-- Anybody signed in may write one, as themselves. Pinning created_by to
-- auth.uid() means the worst anyone can do is complain in their own name.
drop policy if exists "anyone reports"  on fix_requests;
create policy "anyone reports"
  on fix_requests for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.is_nql_staff() or public.is_partner_user())
  );

-- You see your own, so you can read the answer. The owner sees all of them.
drop policy if exists "read own or owner" on fix_requests;
create policy "read own or owner"
  on fix_requests for select to authenticated
  using (created_by = auth.uid() or public.is_owner());

-- Only the owner changes a status or writes a reply. Somebody marking their
-- own report done would make the list useless within a week.
drop policy if exists "owner answers" on fix_requests;
create policy "owner answers"
  on fix_requests for update to authenticated
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner deletes" on fix_requests;
create policy "owner deletes"
  on fix_requests for delete to authenticated using (public.is_owner());

grant select, insert, update, delete on fix_requests to authenticated;


select count(*) as reports_so_far from fix_requests;
