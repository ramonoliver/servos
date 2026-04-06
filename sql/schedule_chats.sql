create table if not exists public.schedule_chats (
  id text primary key,
  schedule_id text not null,
  sender_id text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists schedule_chats_schedule_id_created_at_idx
  on public.schedule_chats (schedule_id, created_at asc);

alter table public.schedule_chats disable row level security;

grant select, insert, update, delete on public.schedule_chats to anon;
grant select, insert, update, delete on public.schedule_chats to authenticated;
