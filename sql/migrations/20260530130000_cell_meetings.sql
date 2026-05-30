begin;

-- Reuniões de célula + presença. Presença alimenta a métrica de "frequência" (saúde).
create table if not exists public.cell_meetings (
  id text primary key,
  cell_id text not null,
  church_id text not null,
  date text not null,
  time text not null default '',
  theme text not null default '',
  word text not null default '',
  notes text not null default '',
  feeling text not null default 'normal',
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists cell_meetings_cell_id_idx on public.cell_meetings (cell_id);
create index if not exists cell_meetings_church_id_idx on public.cell_meetings (church_id);

create table if not exists public.cell_attendance (
  id text primary key,
  meeting_id text not null,
  cell_id text not null,
  user_id text not null,
  status text not null default 'present'
);

create index if not exists cell_attendance_meeting_id_idx on public.cell_attendance (meeting_id);
create index if not exists cell_attendance_cell_id_idx on public.cell_attendance (cell_id);

alter table public.cell_meetings disable row level security;
alter table public.cell_attendance disable row level security;

grant select, insert, update, delete on public.cell_meetings to anon;
grant select, insert, update, delete on public.cell_meetings to authenticated;
grant select, insert, update, delete on public.cell_attendance to anon;
grant select, insert, update, delete on public.cell_attendance to authenticated;

commit;
