begin;

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
