-- Who sent us this client. Asked for on 30 Oct 2026: "Franz, my friend,
-- referred them, and the referral contract is 10% of our income from the
-- client." Run in the Supabase SQL editor. Safe to run twice.
--
-- A referrer is a partner of kind 'referrer': a person or firm that sends
-- clients without being an agency. Their fee lives in partner_agreements as
-- a referral agreement, which the owner alone can read. The lead points at
-- them through referred_by, and the CRM shows "Referred by Franz" to
-- everyone and the percentage to the owner.

alter table partners add column if not exists kind text not null default 'agency';
alter table partners drop constraint if exists partners_kind_check;
alter table partners add constraint partners_kind_check check (kind in ('agency', 'referrer'));
comment on column partners.kind is 'agency: sells property and may use the portal. referrer: sends clients, has a referral fee, never sees the board.';

alter table leads add column if not exists referred_by uuid references partners(id) on delete set null;
create index if not exists leads_referred_by_idx on leads (referred_by);
comment on column leads.referred_by is 'The partner (usually kind referrer) who introduced this client. Their fee is in partner_agreements.';

-- A referrer never sees the agency board, whatever the switch says.
update partners set sees_leads = false where kind = 'referrer' and sees_leads;

-- Then add the first referrer either in the CRM (open a lead, Referred by,
-- "Someone new") or here. Replace the name; the percentage is what we pay
-- them out of what we earn from each client they introduce.
--
-- with r as (
--   insert into partners (name, kind, status, sees_leads, agreement_signed, notes)
--   values ('Franz Example', 'referrer', 'active', false, true, 'Friend of Mirza. Sends clients.')
--   returning id)
-- insert into partner_agreements (partner_id, agreement_type, signed_date, effective_date,
--                                 fee_rate, fee_basis, fee_notes, term_type, notice_period_days, status)
-- select id, 'referral', current_date, current_date, 10, 'net_commission',
--        '10% of what NQL earns from each client Franz introduces, paid when NQL is paid.',
--        'open_ended', 30, 'active'
--   from r;

select count(*) filter (where kind = 'referrer') as referrers,
       count(*) filter (where kind = 'agency')   as agencies
  from partners;
