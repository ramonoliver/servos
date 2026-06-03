alter table if exists public.users
  add column if not exists birth_date date,
  add column if not exists is_child boolean not null default false,
  add column if not exists primary_guardian_id text null,
  add column if not exists guardian_ids text[] not null default '{}'::text[],
  add column if not exists gender text not null default 'nao_informado';

create table if not exists public.kids_guardianship (
  id text primary key,
  church_id text not null references public.churches(id) on delete cascade,
  child_id text not null references public.users(id) on delete cascade,
  guardian_id text not null references public.users(id) on delete cascade,
  relationship text not null default 'Responsavel',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(child_id, guardian_id)
);

create table if not exists public.kids_rooms (
  id text primary key,
  church_id text not null references public.churches(id) on delete cascade,
  name text not null,
  min_age integer not null default 0,
  max_age integer not null default 12,
  capacity integer not null default 12,
  description text not null default '',
  status text not null default 'active',
  volunteer_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kids_rooms_age_check check (min_age >= 0 and max_age >= min_age and max_age <= 12),
  constraint kids_rooms_capacity_check check (capacity >= 0)
);

create table if not exists public.kids_checkins (
  id text primary key,
  church_id text not null references public.churches(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  event_date date not null,
  child_id text not null references public.users(id) on delete cascade,
  room_id text not null references public.kids_rooms(id) on delete restrict,
  guardian_id text not null references public.users(id) on delete restrict,
  code text not null,
  status text not null default 'in_room',
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz null,
  called_at timestamptz null,
  checked_in_by text not null references public.users(id) on delete restrict,
  checked_out_by text null references public.users(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, event_date, code)
);

create unique index if not exists kids_checkins_one_active_child_per_event
  on public.kids_checkins(event_id, event_date, child_id)
  where status <> 'checked_out';

create index if not exists kids_guardianship_church_child_idx on public.kids_guardianship(church_id, child_id);
create index if not exists kids_guardianship_guardian_idx on public.kids_guardianship(guardian_id);
create index if not exists kids_rooms_church_status_idx on public.kids_rooms(church_id, status);
create index if not exists kids_checkins_event_date_idx on public.kids_checkins(church_id, event_id, event_date);
create index if not exists kids_checkins_room_status_idx on public.kids_checkins(room_id, status);
