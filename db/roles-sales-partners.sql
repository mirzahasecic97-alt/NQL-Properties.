-- ---------------------------------------------------------------------------
-- Salespeople get the active agencies, read only.
--
-- Run after db/roles.sql. Safe to re-run.
--
-- Newsletter subscribers stay admin only, unchanged.
-- ---------------------------------------------------------------------------

drop policy if exists "admin partners"          on partners;
drop policy if exists "admin partner contacts"  on partner_contacts;
drop policy if exists "read active partners"    on partners;
drop policy if exists "read active contacts"    on partner_contacts;

-- Admins keep the lot: adding, editing, retiring, deleting.
create policy "admin partners" on partners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Everyone else may read the active ones, and only read them. There is no
-- insert, update or delete policy for a salesperson, so those are refused.
create policy "read active partners" on partners for select to authenticated
  using (public.is_admin() or status = 'active');

create policy "admin partner contacts" on partner_contacts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A contact is readable when its agency is.
create policy "read active contacts" on partner_contacts for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.partners p
      where p.id = partner_contacts.partner_id and p.status = 'active'
    )
  );

select
  (select count(*) from partners) as agencies_total,
  (select count(*) from partners where status = 'active') as visible_to_sales;
