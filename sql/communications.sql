begin;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'messages'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

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

create table if not exists public.member_invitations (
  id text primary key,
  church_id text not null,
  user_id text not null,
  invited_by_user_id text,
  email text not null,
  phone text,
  tracking_token text unique,
  email_status text not null default 'pending',
  sms_status text not null default 'skipped',
  email_error text,
  sms_error text,
  opened_at timestamptz,
  open_count integer not null default 0 check (open_count >= 0),
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_invitations'
      and column_name = 'whatsapp_status'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_invitations'
      and column_name = 'sms_status'
  ) then
    alter table public.member_invitations
      add column sms_status text not null default 'skipped';

    update public.member_invitations
      set sms_status = whatsapp_status
      where whatsapp_status is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_invitations'
      and column_name = 'whatsapp_error'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_invitations'
      and column_name = 'sms_error'
  ) then
    alter table public.member_invitations
      add column sms_error text;

    update public.member_invitations
      set sms_error = whatsapp_error
      where whatsapp_error is not null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_invitations_email_status_check'
  ) then
    alter table public.member_invitations
      add constraint member_invitations_email_status_check
      check (email_status in ('pending', 'sent', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_invitations_sms_status_check'
  ) then
    alter table public.member_invitations
      add constraint member_invitations_sms_status_check
      check (sms_status in ('pending', 'sent', 'failed', 'skipped'));
  end if;
end $$;

create index if not exists member_invitations_user_id_idx
  on public.member_invitations (user_id, created_at desc);

create index if not exists member_invitations_tracking_token_idx
  on public.member_invitations (tracking_token);

alter table public.member_invitations disable row level security;

grant select, insert, update, delete on public.member_invitations to anon;
grant select, insert, update, delete on public.member_invitations to authenticated;

create table if not exists public.password_reset_tokens (
  id text primary key,
  church_id text not null,
  user_id text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens (user_id, created_at desc);

create index if not exists password_reset_tokens_expires_at_idx
  on public.password_reset_tokens (expires_at);

alter table public.password_reset_tokens disable row level security;

grant select, insert, update, delete on public.password_reset_tokens to anon;
grant select, insert, update, delete on public.password_reset_tokens to authenticated;

commit;
