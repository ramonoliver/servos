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

alter table public.member_invitations
  alter column email_status set default 'pending',
  alter column sms_status set default 'skipped';

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
