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
  open_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists member_invitations_user_id_idx
  on public.member_invitations (user_id, created_at desc);

create index if not exists member_invitations_tracking_token_idx
  on public.member_invitations (tracking_token);
