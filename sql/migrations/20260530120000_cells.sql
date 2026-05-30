begin;

-- Células (small groups) — real backend for the pastoral cells module.
-- Leaders and members reference the existing public.users table.
create table if not exists public.cells (
  id text primary key,
  church_id text not null,
  name text not null,
  description text not null default '',
  cover_color text not null default '#FF6B57',
  leader_id text,
  co_leader_id text,
  supervisor_id text,
  address text not null default '',
  week_day text not null default '',
  time text not null default '',
  max_members integer not null default 12 check (max_members >= 0),
  audience text not null default '',
  status text not null default 'active',
  health jsonb not null default '{"frequency":70,"communion":70,"participation":70,"growth":70,"engagement":70,"care":70}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cells_church_id_idx on public.cells (church_id);

create table if not exists public.cell_members (
  id text primary key,
  cell_id text not null,
  user_id text not null,
  status text not null default 'active',
  joined_at timestamptz not null default now()
);

create index if not exists cell_members_cell_id_idx on public.cell_members (cell_id);
create unique index if not exists cell_members_cell_id_user_id_idx
  on public.cell_members (cell_id, user_id);

alter table public.cells disable row level security;
alter table public.cell_members disable row level security;

grant select, insert, update, delete on public.cells to anon;
grant select, insert, update, delete on public.cells to authenticated;
grant select, insert, update, delete on public.cell_members to anon;
grant select, insert, update, delete on public.cell_members to authenticated;

commit;
