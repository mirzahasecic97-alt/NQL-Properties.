-- Where a lead came from: the tags on the ad link (?utm_source=meta&
-- utm_medium=paid_social&utm_campaign=ski), carried by js/source.js into
-- every form since 11 Nov 2026 and shown on the full lead brief as Source,
-- Medium and Campaign. Empty for Google, a typed address or a shared link.
-- Run in the Supabase SQL editor. Safe to run twice.
alter table leads add column if not exists utm_source text;
alter table leads add column if not exists utm_medium text;
alter table leads add column if not exists utm_campaign text;
comment on column leads.utm_source is 'Ad link tag utm_source, e.g. meta. Empty when the visitor did not come from a tagged link.';
comment on column leads.utm_medium is 'Ad link tag utm_medium, e.g. paid_social.';
comment on column leads.utm_campaign is 'Ad link tag utm_campaign, e.g. ski.';
-- Leads that arrived before this ran kept the tags in raw.
update leads set
  utm_source = coalesce(utm_source, raw->>'utm_source'),
  utm_medium = coalesce(utm_medium, raw->>'utm_medium'),
  utm_campaign = coalesce(utm_campaign, raw->>'utm_campaign')
where raw ? 'utm_source' or raw ? 'utm_medium' or raw ? 'utm_campaign';
select utm_source, utm_medium, utm_campaign, count(*) from leads group by 1, 2, 3 order by 4 desc;
