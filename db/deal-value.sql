-- ---------------------------------------------------------------------------
-- A number on the pipeline.
--
-- budget is text a person typed, like "1M to 2M", which cannot be summed.
-- deal_value is what the deal is actually expected to be worth, in euro.
-- ---------------------------------------------------------------------------

alter table leads add column if not exists deal_value numeric;

comment on column leads.deal_value is
  'Expected value of the deal in euro. Set at offer stage; summed per stage.';

select count(*) as leads_total, count(deal_value) as with_a_value from leads;
