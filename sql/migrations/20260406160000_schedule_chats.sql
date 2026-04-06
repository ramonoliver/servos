begin;

create table if not exists public.schedule_chats (
  id text primary key,
  schedule_id text not null,
  sender_id text not null,
  content text not null check (length(trim(content)) > 0 and length(content) <= 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists schedule_chats_schedule_id_created_at_idx
  on public.schedule_chats (schedule_id, created_at asc);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'schedule_chats'
  ) then
    alter publication supabase_realtime add table public.schedule_chats;
  end if;
end $$;

alter table public.schedule_chats disable row level security;

grant select, insert, update, delete on public.schedule_chats to anon;
grant select, insert, update, delete on public.schedule_chats to authenticated;

commit;
