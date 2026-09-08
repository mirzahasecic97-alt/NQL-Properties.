-- ---------------------------------------------------------------------------
-- NQL Properties — let the agency logins read the portal again
--
-- The portal was returning:
--
--   403  42501  permission denied for view partner_board
--
-- That is not a policy and not a missing lead. The view is there; the agency
-- login simply has no read privilege on it. A view that is dropped and
-- recreated loses its grants, and the grant that should follow the create did
-- not run, so the portal has been asking a question it was never allowed to
-- ask. Every country you set was correct and made no difference.
--
-- SAFE BY CONSTRUCTION
--   creates nothing, drops nothing, changes no view, no policy, no row
--   an object that does not exist is skipped with a notice, not an error
--   granting a privilege that is already granted does nothing
--   re-running it does the same thing again
--
-- Run in the Supabase SQL editor.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('partner_board',     'select'),
      ('partner_leads',     'select'),
      ('partner_countries', 'select, insert, update, delete'),
      ('partner_interest',  'select, insert, update, delete'),
      ('partner_offers',    'select, insert, update, delete'),
      ('fix_requests',      'select, insert, update, delete'),
      ('partners',          'select, insert, update, delete'),
      ('partner_users',     'select'),
      ('leads',             'select, insert, update, delete')
    ) as t(rel, privs)
  loop
    if to_regclass('public.' || r.rel) is null then
      raise notice 'skipped %, not present', r.rel;
    else
      execute format('grant %s on public.%I to authenticated', r.privs, r.rel);
      raise notice 'granted % on %', r.privs, r.rel;
    end if;
  end loop;
end $$;

-- The row level policies decide who sees which rows and are untouched by the
-- above. A grant only decides whether the door opens at all.

-- --------------------------------------------------------------------------
-- What the agency logins can now read. partner_board must appear.
-- --------------------------------------------------------------------------

select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as granted
  from information_schema.role_table_grants
 where grantee     = 'authenticated'
   and table_schema = 'public'
   and table_name in ('partner_board', 'partner_leads', 'partner_countries',
                      'partner_interest', 'partner_offers', 'fix_requests')
 group by table_name
 order by table_name;
