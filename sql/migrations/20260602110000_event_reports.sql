begin;

create table if not exists public.event_reports (
  id text primary key,
  church_id text not null,
  event_id text not null,
  event_date text not null default '',
  attendance_count integer not null default 0,
  volunteers_count integer not null default 0,
  new_converts_count integer not null default 0,
  reconciliations_count integer not null default 0,
  prayer_requests_count integer not null default 0,
  people_followed_count integer not null default 0,
  visitors_count integer not null default 0,
  children_count integer not null default 0,
  notes text not null default '',
  reported_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, event_id, event_date)
);

create index if not exists event_reports_church_id_idx on public.event_reports (church_id);
create index if not exists event_reports_event_id_idx on public.event_reports (event_id);
create index if not exists event_reports_event_date_idx on public.event_reports (event_date);

alter table public.event_reports disable row level security;

grant select, insert, update, delete on public.event_reports to anon, authenticated;

commit;
