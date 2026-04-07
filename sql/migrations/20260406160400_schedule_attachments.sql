begin;

create table if not exists public.schedule_attachments (
  id text primary key,
  schedule_id text not null,
  uploaded_by_user_id text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 4194304),
  content_base64 text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists schedule_attachments_schedule_id_created_at_idx
  on public.schedule_attachments (schedule_id, created_at desc);

alter table public.schedule_attachments disable row level security;

grant select, insert, update, delete on public.schedule_attachments to anon;
grant select, insert, update, delete on public.schedule_attachments to authenticated;

commit;
