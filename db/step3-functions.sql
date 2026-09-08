-- ---------------------------------------------------------------------------
-- NQL Properties — the functions the board calls
--
-- Part 3 of 4. Run them in order. The Supabase editor runs everything you
-- paste as one transaction, so a single bad line rolls the whole thing back.
-- Split up, a failure lands on one part and the parts before it stay done.
-- ---------------------------------------------------------------------------

create or replace function public.budget_band(budget_text text, value numeric)
returns text language plpgsql immutable as $$
declare n numeric; digits text;
begin
  n := value;
  if n is null and budget_text is not null then
    digits := substring(replace(budget_text, ',', '.') from '[0-9]+\.?[0-9]*');
    if digits is not null and digits <> '' then
      n := digits::numeric;
      if lower(budget_text) like '%m%' and n < 100 then n := n * 1000000;
      elsif n < 10000 then n := n * 1000; end if;
    end if;
  end if;
  if    n is null or n <= 0 then return 'Not stated';
  elsif n <   250000 then return 'Under 250k';
  elsif n <   500000 then return '250k to 500k';
  elsif n <  1000000 then return '500k to 1M';
  elsif n <  2000000 then return '1M to 2M';
  else                    return 'Over 2M';
  end if;
end; $$;

create or replace function public.match_band(score smallint)
returns text language sql immutable as $$
  select case
    when score is null then null
    when score >= 80   then 'hot'
    when score >= 50   then 'warm'
    when score >= 1    then 'limited'
    else null end;
$$;

create or replace function public.info_score(
  first_name text, last_name text, email text, phone text,
  country text, budget text, deal_value numeric,
  property_name text, project_interest text, message text
) returns smallint language sql immutable as $$
  select (round(100.0 * (
      (nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), '') is not null)::int
    + (nullif(trim(coalesce(email,'')), '') is not null)::int
    + (nullif(trim(coalesce(phone,'')), '') is not null)::int
    + (nullif(trim(coalesce(country,'')), '') is not null)::int
    + ((nullif(trim(coalesce(budget,'')), '') is not null) or (deal_value is not null))::int
    + (nullif(trim(coalesce(property_name,'') || coalesce(project_interest,'')), '') is not null)::int
    + (nullif(trim(coalesce(message,'')), '') is not null)::int
  ) / 7.0))::smallint;
$$;

grant execute on function public.budget_band(text, numeric) to authenticated;
grant execute on function public.match_band(smallint)       to authenticated;
grant execute on function public.info_score(text,text,text,text,text,text,numeric,text,text,text)
  to authenticated;
