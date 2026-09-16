-- ---------------------------------------------------------------------------
-- NQL Properties — when each person last signed in
--
-- Read off auth.users, for the owner alone: the view answers with nothing for
-- anybody else, so no screen can show it to them. Paired in the CRM with the
-- presence table, which says when each person last had the CRM open.
--
-- Creates one view that nothing depends on. Safe to run twice.
-- ---------------------------------------------------------------------------

drop view if exists staff_logins;
create view staff_logins
with (security_barrier = true, security_invoker = false) as
  select ns.user_id,
         u.last_sign_in_at,
         u.created_at as account_created_at
    from nql_staff ns
    join auth.users u on u.id = ns.user_id
   where public.is_owner();

grant select on staff_logins to authenticated;

select count(*) as people_you_can_see from staff_logins;
