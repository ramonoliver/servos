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
  whatsapp_status text not null default 'skipped',
  email_error text,
  whatsapp_error text,
  opened_at timestamptz,
  open_count integer not null default 0 check (open_count >= 0),
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
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
    where conname = 'member_invitations_whatsapp_status_check'
  ) then
    alter table public.member_invitations
      add constraint member_invitations_whatsapp_status_check
      check (whatsapp_status in ('pending', 'sent', 'failed', 'skipped'));
  end if;
end $$;

create index if not exists member_invitations_user_id_idx
  on public.member_invitations (user_id, created_at desc);

create index if not exists member_invitations_tracking_token_idx
  on public.member_invitations (tracking_token);

alter table public.member_invitations disable row level security;

grant select, insert, update, delete on public.member_invitations to anon;
grant select, insert, update, delete on public.member_invitations to authenticated;

commit;
