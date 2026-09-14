-- ---------------------------------------------------------------------------
-- NQL Properties — partner agreements
--
-- One record per signed agreement, the terms that matter for money and for
-- getting out, and a view that tells the rest of the team only when a
-- contract renews. The full terms are readable by the owner alone; row rules
-- enforce that at the database, so no screen can leak them.
--
-- SAFE BY CONSTRUCTION: creates tables and policies, replaces one view that
-- nothing depends on, seeds by upsert. Drops nothing else. Safe to run twice.
-- Paste the whole file into the Supabase SQL editor and run it.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------- the table
create table if not exists partner_agreements (
  id                    uuid primary key default gen_random_uuid(),
  partner_id            uuid not null references partners(id) on delete cascade,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  agreement_type        text not null check (agreement_type in ('referral', 'agency', 'tripartite')),
  signed_date           date,
  effective_date        date,

  fee_rate              numeric,
  fee_basis             text check (fee_basis in ('net_commission', 'sale_price', 'tiered')),
  fee_notes             text,
  tail_period_months    integer,

  term_type             text not null check (term_type in ('open_ended', 'fixed_auto_renew')),
  initial_term_months   integer,
  contract_end_date     date,
  auto_renew_months     integer,
  notice_period_days    integer not null default 30,
  -- Set when the agreement states no notice period and the number here is
  -- our own review trigger, not a contractual one.
  notice_is_internal    boolean not null default false,
  -- Computed, never typed: the last day to give notice. Null for open ended
  -- agreements, which can be ended any day on notice_period_days' notice.
  notice_deadline       date generated always as (
                          case when term_type = 'fixed_auto_renew' and contract_end_date is not null
                               then contract_end_date - notice_period_days end
                        ) stored,

  governing_law         text,
  jurisdiction          text,
  signatory_name        text,
  signatory_title       text,
  counterparty_reg_no   text,
  counterparty_address  text,

  status                text not null default 'active'
                        check (status in ('active', 'expired', 'terminated', 'unsigned')),
  document_path         text,
  warnings              text,
  restrictions          text,

  unique (partner_id, agreement_type, signed_date)
);

create index if not exists partner_agreements_end_idx on partner_agreements (contract_end_date);

-- ------------------------------------------------------------ owner only
alter table partner_agreements enable row level security;
drop policy if exists "owner reads agreements"   on partner_agreements;
drop policy if exists "owner manages agreements" on partner_agreements;
create policy "owner reads agreements"
  on partner_agreements for select to authenticated using (public.is_owner());
create policy "owner manages agreements"
  on partner_agreements for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
grant select, insert, update, delete on partner_agreements to authenticated;

-- --------------------------------------------- what everyone else may see
-- Renewal facts only: which partner, what kind of term, when it ends, when
-- notice is due, and a colour. No fee, no law, no signatory, no notes.
drop view if exists agreement_renewals;
create view agreement_renewals
with (security_barrier = true, security_invoker = false) as
  select a.id, a.partner_id, p.name as partner_name,
         a.agreement_type, a.term_type, a.status,
         a.contract_end_date, a.auto_renew_months,
         a.notice_period_days, a.notice_is_internal, a.notice_deadline,
         (a.contract_end_date - current_date) as days_to_end,
         (a.notice_deadline   - current_date) as days_to_notice,
         case
           when a.term_type = 'open_ended'                         then 'open'
           when a.status in ('expired', 'terminated')              then 'closed'
           when a.notice_deadline <= current_date
             or a.contract_end_date <= current_date                then 'red'
           when a.notice_deadline - current_date <= 30             then 'red'
           when a.contract_end_date - current_date <= 120          then 'amber'
           else 'green'
         end as state
    from partner_agreements a
    join partners p on p.id = a.partner_id
   where public.is_nql_staff();
grant select on agreement_renewals to authenticated;

-- ------------------------------------------------------------- renewal
-- Rolls the end date forward by the renewal term. The generated column
-- recomputes the notice deadline on its own.
create or replace function public.renew_agreement(target uuid)
returns partner_agreements language plpgsql security definer set search_path = public as $$
declare a partner_agreements;
begin
  if not public.is_owner() then raise exception 'Only the owner may renew an agreement.'; end if;
  update partner_agreements
     set contract_end_date = (contract_end_date + make_interval(months => coalesce(auto_renew_months, 12)))::date,
         updated_at = now()
   where id = target and term_type = 'fixed_auto_renew' and contract_end_date is not null
   returning * into a;
  if a.id is null then raise exception 'No fixed term agreement with that id.'; end if;
  return a;
end $$;
grant execute on function public.renew_agreement(uuid) to authenticated;

-- ------------------------------------------------- alerts already sent
-- The daily job writes here so a 120 day warning goes once, not every day.
create table if not exists agreement_alerts (
  agreement_id uuid not null references partner_agreements(id) on delete cascade,
  milestone    text not null,     -- e.g. end-120, notice-30
  sent_at      timestamptz not null default now(),
  sent_to      text,
  primary key (agreement_id, milestone)
);
alter table agreement_alerts enable row level security;
drop policy if exists "owner reads alerts" on agreement_alerts;
create policy "owner reads alerts" on agreement_alerts for select to authenticated using (public.is_owner());
grant select on agreement_alerts to authenticated;

-- ------------------------------------------------------------------ seed
-- Keyed by partner name and signing date, so running this again updates
-- rather than duplicates. A partner missing from the list is created.
create or replace function pg_temp.seed_agreement(partner_pattern text, partner_country text, a jsonb)
returns void language plpgsql as $$
declare pid uuid;
begin
  select id into pid from partners where name ilike partner_pattern order by created_at limit 1;
  if pid is null then
    insert into partners (name, country, agreement_signed, status)
    values (a->>'partner_name', partner_country, (a->>'status') = 'active', 'active')
    returning id into pid;
  end if;
  update partners set agreement_signed = ((a->>'status') = 'active') where id = pid;

  insert into partner_agreements (
    partner_id, agreement_type, signed_date, effective_date,
    fee_rate, fee_basis, fee_notes, tail_period_months,
    term_type, initial_term_months, contract_end_date, auto_renew_months,
    notice_period_days, notice_is_internal,
    governing_law, jurisdiction, signatory_name, signatory_title,
    counterparty_reg_no, counterparty_address, status, document_path, warnings, restrictions)
  values (
    pid, a->>'agreement_type', (a->>'signed_date')::date, (a->>'effective_date')::date,
    (a->>'fee_rate')::numeric, a->>'fee_basis', a->>'fee_notes', (a->>'tail_period_months')::int,
    a->>'term_type', (a->>'initial_term_months')::int, (a->>'contract_end_date')::date, (a->>'auto_renew_months')::int,
    coalesce((a->>'notice_period_days')::int, 30), coalesce((a->>'notice_is_internal')::boolean, false),
    a->>'governing_law', a->>'jurisdiction', a->>'signatory_name', a->>'signatory_title',
    a->>'counterparty_reg_no', a->>'counterparty_address', a->>'status', a->>'document_path', a->>'warnings', a->>'restrictions')
  on conflict (partner_id, agreement_type, signed_date) do update set
    effective_date = excluded.effective_date, fee_rate = excluded.fee_rate, fee_basis = excluded.fee_basis,
    fee_notes = excluded.fee_notes, tail_period_months = excluded.tail_period_months,
    term_type = excluded.term_type, initial_term_months = excluded.initial_term_months,
    contract_end_date = excluded.contract_end_date, auto_renew_months = excluded.auto_renew_months,
    notice_period_days = excluded.notice_period_days, notice_is_internal = excluded.notice_is_internal,
    governing_law = excluded.governing_law, jurisdiction = excluded.jurisdiction,
    signatory_name = excluded.signatory_name, signatory_title = excluded.signatory_title,
    counterparty_reg_no = excluded.counterparty_reg_no, counterparty_address = excluded.counterparty_address,
    status = excluded.status, document_path = excluded.document_path,
    warnings = excluded.warnings, restrictions = excluded.restrictions, updated_at = now();
end $$;

select pg_temp.seed_agreement('Luxury Solutions%', 'Italy', $j${
  "partner_name": "Luxury Solutions Srl",
  "agreement_type": "referral", "signed_date": "2026-04-14", "effective_date": "2026-04-13",
  "fee_rate": 20, "fee_basis": "net_commission",
  "fee_notes": "Only on commission paid by the introduced buyer. Excludes seller, co-broker and affiliate commission, co-brokerage splits, retainers and advisory fees. Invoice on written confirmation of completion, due in 7 days.",
  "tail_period_months": 6,
  "term_type": "open_ended", "notice_period_days": 30,
  "governing_law": "Italy", "jurisdiction": "Court of Rome",
  "signatory_name": "Mirko Delfini", "signatory_title": "Broker Manager",
  "counterparty_reg_no": "02765130907, REA SS-202825",
  "counterparty_address": "Piazzetta degli Archi snc, Arzachena, Sardinia",
  "status": "active",
  "document_path": "01 Signed Agreements/260413 Luxury Solutions Srl_SIGNED.pdf",
  "restrictions": "Tail requires a direct and demonstrable causal link between the lead and the sale."
}$j$::jsonb);

select pg_temp.seed_agreement('Engel%', 'Italy', $j${
  "partner_name": "Finest Italian Estates srl (Engel & Völkers)",
  "agreement_type": "referral", "signed_date": "2026-04-16", "effective_date": "2026-04-16",
  "fee_rate": 25, "fee_basis": "net_commission",
  "fee_notes": "Calculated after the 12.5% E&V master-licence royalty. Buyer pays NQL directly; the partner must write that obligation into every sale or reservation agreement and stays fully liable if they do not. Lead Confirmation Notice: no written objection within 48 hours means accepted.",
  "tail_period_months": 12,
  "term_type": "open_ended", "notice_period_days": 30,
  "governing_law": "Norway", "jurisdiction": "Norwegian courts",
  "signatory_name": "Yasemin Baysal", "signatory_title": "CEO",
  "counterparty_reg_no": "03218580136",
  "counterparty_address": "Via Regina 43, 22012 Cernobbio (CO), Italy",
  "status": "active",
  "document_path": "01 Signed Agreements/260416 Engel Volkers (Finest Italian Estates)_SIGNED.pdf",
  "warnings": "Drafting errors to fix before the template is reused: two clauses numbered 3.10, and clause 11.6 reads 'three (12) months'.",
  "restrictions": "Tail applies to direct or indirect transactions."
}$j$::jsonb);

select pg_temp.seed_agreement('Stephanie Valente', 'Norway', $j${
  "partner_name": "Stephanie Valente",
  "agreement_type": "referral", "signed_date": "2026-04-16", "effective_date": "2026-04-16",
  "fee_rate": 5, "fee_basis": "sale_price",
  "fee_notes": "5% of the sale price excluding VAT, not of commission. Buyer pays NQL directly; partner liable as fallback. Lead Confirmation Notice with the 48 hour deemed acceptance rule.",
  "tail_period_months": 3,
  "term_type": "open_ended", "notice_period_days": 30,
  "governing_law": "Norway", "jurisdiction": "Norwegian courts",
  "signatory_name": "Stephanie Valente", "signatory_title": "Private individual",
  "counterparty_address": "Jerpefaret 12 B, 1447 Drøbak, Norway",
  "status": "active",
  "document_path": "01 Signed Agreements/260416 Stephanie Valente_SIGNED.pdf"
}$j$::jsonb);

select pg_temp.seed_agreement('Romolini%', 'Italy', $j${
  "partner_name": "Agenzia Romolini Immobiliare Srl",
  "agreement_type": "referral", "signed_date": "2026-04-21", "effective_date": "2026-04-21",
  "fee_rate": 20, "fee_basis": "net_commission",
  "fee_notes": "20% of the partner's net commission on the final sale price. Payment within 7 days of invoice; partner must notify on preliminary agreement and on completion. No buyer-pays mechanism.",
  "tail_period_months": 12,
  "term_type": "open_ended", "notice_period_days": 30,
  "governing_law": "Norway", "jurisdiction": "Norwegian courts",
  "signatory_name": "Riccardo Romolini", "signatory_title": "Owner & CEO",
  "counterparty_reg_no": "AR-158799",
  "counterparty_address": "Piazza Torre di Berta 4, 52037 Sansepolcro (AR), Italy",
  "status": "active",
  "document_path": "01 Signed Agreements/260421 Romolini_SIGNED.pdf",
  "restrictions": "Tail applies to direct or indirect transactions; fees stay payable despite delayed completion or involvement of affiliates or nominees."
}$j$::jsonb);

select pg_temp.seed_agreement('Evergreen%', 'Cyprus', $j${
  "partner_name": "Evergreen Developments Group",
  "agreement_type": "agency", "signed_date": "2026-04-28", "effective_date": "2026-04-28",
  "fee_basis": "tiered",
  "fee_notes": "NQL is the selling agent. 5% on leads closed by the developer's own sales team; 10% where NQL organises the inspection trip or supports the client to signing; 3% on resales. All discounts borne by NQL. Paid within 14 days of the developer receiving buyer payment, requiring a signed contract, at least 35% of the purchase price paid, and Land Registry registration. Reservation deposits do not count. Fly and Buy: 3 nights' accommodation provided by the developer.",
  "term_type": "fixed_auto_renew", "initial_term_months": 12,
  "contract_end_date": "2027-04-28", "auto_renew_months": 12,
  "notice_period_days": 90, "notice_is_internal": true,
  "governing_law": "TRNC", "jurisdiction": "TRNC",
  "counterparty_address": "25 group companies listed in Appendix A. Notices: morvarid@evergreencyrpus.com",
  "status": "active",
  "document_path": "01 Signed Agreements/260428 Evergreen_SIGNED.pdf",
  "warnings": "No notice period is stated in the agreement; the 90 days here is an internal review trigger, not a contractual one. The Agent's notice block (NQL name, phone, email) is blank in the signed PDF and should be completed.",
  "restrictions": "During the term and for 12 months after it, NQL may not market resales owned by residents inside Evergreen sites, nor use the developer's materials for such resales."
}$j$::jsonb);

select pg_temp.seed_agreement('Andrew Charles Morley%', 'Italy', $j${
  "partner_name": "Andrew Charles Morley (introducer, off-market Italy)",
  "agreement_type": "tripartite", "signed_date": "2026-05-16", "effective_date": "2026-05-16",
  "fee_rate": 25, "fee_basis": "net_commission",
  "fee_notes": "Split of the agent's net commission ex. IVA: agent 60%, NQL 25%, Morley 15%. Paid within 30 days of the agent receiving funds, in EUR, against invoice. Audit right once per 12 months. Morley's 15% survives 60 months past termination and follows NQL into any successor or parallel arrangement with the same agent. Non-circumvention runs 36 months after termination.",
  "tail_period_months": 60,
  "term_type": "fixed_auto_renew", "initial_term_months": 24,
  "contract_end_date": "2028-05-16", "auto_renew_months": 12,
  "notice_period_days": 60,
  "governing_law": "Italy", "jurisdiction": "Courts of Florence",
  "signatory_name": "Andrew Charles Morley", "signatory_title": "Introducer",
  "counterparty_reg_no": "CF MRLNRW96L02Z404F",
  "counterparty_address": "Via Antonio Garbasso 26, Firenze, Italy. amorley70@yahoo.com",
  "status": "unsigned",
  "document_path": "01 Signed Agreements/260516 NQL-Agent-Morley NDA Non-Circumvention_SIGNED.pdf",
  "warnings": "Party 2, the Italian agent, is blank and unsigned. NQL and Morley are bound to each other, but the commission split has no counterparty until an agent signs.",
  "restrictions": "Tail of 60 months from lead delivery, extendable by 36 months on written acknowledgment of an active pipeline, repeatable."
}$j$::jsonb);

-- ------------------------------------------------------------ what landed
select partner_name, agreement_type, term_type, status,
       contract_end_date, notice_deadline, days_to_end, state
  from agreement_renewals
 order by contract_end_date nulls last, partner_name;
