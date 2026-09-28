-- ---------------------------------------------------------------------------
-- NQL Properties — ten leads from the paid campaign "NQL USA og others"
--
-- All looking in Italy. Filed as Advertising, stage new, unassigned, with the
-- campaign noted on each. Lead numbers are assigned by the trigger. Anyone
-- whose email is already in the CRM is skipped, so this is safe to run twice.
-- ---------------------------------------------------------------------------

with incoming (first_name, last_name, email, phone) as (values
  ('Karen', 'Green', 'denisegk6@gmail.com', '+19472786376'),
  ('Ivano', 'DeSantis', 'ivanodesantis117@gmail.com', '+14169901041'),
  ('Sandro', 'Pizzicarola', 'sandropizzicarola55@gmail.com', '+12032575474'),
  ('Barry', 'O''Connor', 'barryoconnor55@gmail.com', '+17818446266'),
  ('Stephen', 'Jeremy Owens', 'owe_step@yahoo.com', '+17705487592'),
  ('Arcangelo', 'Genova', 'nonnoange57@gmail.com', '+16476888522'),
  ('Kais', 'Abiraad', 'kabiraad00@gmail.com', '+19143840475'),
  ('Anthony', 'Lombardo', 'lombardo_tony@rocketmail.com', '+19104018298'),
  ('Chilcote', 'Lee', 'waltlee57@gmail.com', '+19549137568'),
  ('Greg', 'Mullen', 'g9rocky@yahoo.ca', '+16132227714')
)
insert into leads (source, stage, first_name, last_name, email, phone, country, based_in, message, raw)
select 'ads', 'new', i.first_name, i.last_name, i.email, i.phone, 'Italy', 'North America',
       'Imported from the paid campaign "NQL USA og others". Channel: email. Status at import: intake.',
       jsonb_build_object('campaign', 'NQL USA og others', 'channel', 'Email', 'status', 'Intake', 'imported_on', current_date)
  from incoming i
 where not exists (select 1 from leads l where lower(l.email) = i.email);

select lead_no, first_name, last_name, email, phone, country, source, stage
  from leads
 where lower(email) in ('denisegk6@gmail.com', 'ivanodesantis117@gmail.com', 'sandropizzicarola55@gmail.com', 'barryoconnor55@gmail.com', 'owe_step@yahoo.com', 'nonnoange57@gmail.com', 'kabiraad00@gmail.com', 'lombardo_tony@rocketmail.com', 'waltlee57@gmail.com', 'g9rocky@yahoo.ca')
 order by lead_no;
