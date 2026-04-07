begin;

create table if not exists public.schedule_slots (
  id text primary key,
  schedule_id text not null,
  function_name text not null,
  quantity integer not null check (quantity >= 0),
  filled integer not null default 0 check (filled >= 0)
);

create index if not exists schedule_slots_schedule_id_idx
  on public.schedule_slots (schedule_id);

create unique index if not exists schedule_slots_schedule_id_function_name_idx
  on public.schedule_slots (schedule_id, function_name);

alter table public.schedule_slots disable row level security;

grant select, insert, update, delete on public.schedule_slots to anon;
grant select, insert, update, delete on public.schedule_slots to authenticated;

commit;
