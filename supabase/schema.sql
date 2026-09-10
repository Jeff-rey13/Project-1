-- Plan Room: schema, security and synthetic seed data
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run: it rebuilds the table.
-- ALL DATA IS SYNTHETIC. No real HDB survey plans are used.

drop table if exists public.survey_plans;

create table public.survey_plans (
  id          bigint generated always as identity primary key,
  plan_id     text unique not null,
  survey_type text not null check (survey_type in ('Engineering Topo', '3D LiDAR Interior', 'Recess Area')),
  town        text not null,
  block       text not null,
  survey_date date not null,
  status      text not null check (status in ('Requested', 'Fieldwork', 'Processing', 'QC', 'Approved')),
  surveyor    text not null,
  file_format text not null check (file_format in ('DWG', 'LAS', 'PDF')),
  lat         double precision not null check (lat between 1.15 and 1.48),
  lon         double precision not null check (lon between 103.6 and 104.1)
);

create index survey_plans_filters_idx on public.survey_plans (town, survey_type, status);
create index survey_plans_date_idx    on public.survey_plans (survey_date desc);
create index survey_plans_geo_idx     on public.survey_plans (lat, lon);

-- Security: read-only public access. No insert/update/delete policies exist,
-- so the public API cannot change data.
alter table public.survey_plans enable row level security;

create policy "Read-only access to synthetic plans"
  on public.survey_plans for select
  to anon, authenticated
  using (true);

-- Synthetic seed: 240 plans across 14 HDB towns (approximate town centres).
with towns (n, town, lat, lon) as (
  values
    (1,  'Ang Mo Kio',    1.3691, 103.8454),
    (2,  'Bedok',         1.3236, 103.9273),
    (3,  'Bishan',        1.3526, 103.8352),
    (4,  'Bukit Batok',   1.3590, 103.7637),
    (5,  'Choa Chu Kang', 1.3840, 103.7470),
    (6,  'Hougang',       1.3612, 103.8863),
    (7,  'Jurong West',   1.3404, 103.7090),
    (8,  'Punggol',       1.3984, 103.9072),
    (9,  'Queenstown',    1.2942, 103.7861),
    (10, 'Sengkang',      1.3868, 103.8914),
    (11, 'Tampines',      1.3496, 103.9568),
    (12, 'Toa Payoh',     1.3343, 103.8563),
    (13, 'Woodlands',     1.4382, 103.7890),
    (14, 'Yishun',        1.4304, 103.8354)
),
s as (
  select g,
         1 + floor(random() * 14)::int            as n,
         1 + floor(random() * 3)::int             as t,
         current_date - floor(power(random(), 1.8) * 1000)::int as d  -- skewed toward recent
  from generate_series(1, 240) as g
)
insert into public.survey_plans
  (plan_id, survey_type, town, block, survey_date, status, surveyor, file_format, lat, lon)
select
  (array['TOP', 'LID', 'REC'])[s.t] || '-' || extract(year from s.d)::int || '-' || lpad(s.g::text, 4, '0'),
  (array['Engineering Topo', '3D LiDAR Interior', 'Recess Area'])[s.t],
  towns.town,
  'Blk ' || (100 + floor(random() * 880)::int)::text || (array['', '', '', 'A', 'B'])[1 + floor(random() * 5)::int],
  s.d,
  case
    when s.d < current_date - 365 then
      case when random() < 0.95 then 'Approved' else 'QC' end
    else (array['Requested', 'Fieldwork', 'Processing', 'QC', 'Approved'])[1 + floor(random() * 5)::int]
  end,
  (array['Tan W. L.', 'Nur Aisyah R.', 'Rajesh K.', 'Lim S. H.', 'Goh J. M.', 'Priya S.'])[1 + floor(random() * 6)::int],
  (array['DWG', 'LAS', 'PDF'])[s.t],
  round((towns.lat + (random() - 0.5) * 0.016)::numeric, 6),
  round((towns.lon + (random() - 0.5) * 0.016)::numeric, 6)
from s
join towns using (n);

-- Quick check (should return 240 rows total, spread across towns)
-- select town, count(*) from public.survey_plans group by town order by town;
