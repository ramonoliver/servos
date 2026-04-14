begin;

create table if not exists public.push_tokens (
  id text primary key,
  user_id text not null,
  church_id text not null,
  token text not null,
  platform text not null,
  device_name text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists push_tokens_token_idx
  on public.push_tokens (token);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon;
revoke all on public.push_tokens from authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;
drop policy if exists push_tokens_isolation on public.push_tokens;
create policy push_tokens_isolation on public.push_tokens
  using (church_id = current_setting('request.jwt.claims', true)::json->>'church_id')
  with check (church_id = current_setting('request.jwt.claims', true)::json->>'church_id');

create table if not exists public.points_history (
  id text primary key,
  user_id text not null,
  church_id text not null,
  schedule_id text,
  reason text not null,
  points integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists points_history_user_id_idx
  on public.points_history (user_id, created_at desc);

alter table public.points_history enable row level security;
revoke all on public.points_history from anon;
revoke all on public.points_history from authenticated;
grant select, insert, update, delete on public.points_history to authenticated;
drop policy if exists points_history_isolation on public.points_history;
create policy points_history_isolation on public.points_history
  using (church_id = current_setting('request.jwt.claims', true)::json->>'church_id')
  with check (church_id = current_setting('request.jwt.claims', true)::json->>'church_id');

create table if not exists public.badges (
  id text primary key,
  church_id text not null,
  key text not null,
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists badges_church_key_idx
  on public.badges (church_id, key);

alter table public.badges enable row level security;
revoke all on public.badges from anon;
revoke all on public.badges from authenticated;
grant select, insert, update, delete on public.badges to authenticated;
drop policy if exists badges_isolation on public.badges;
create policy badges_isolation on public.badges
  using (church_id = current_setting('request.jwt.claims', true)::json->>'church_id')
  with check (church_id = current_setting('request.jwt.claims', true)::json->>'church_id');

create table if not exists public.user_badges (
  id text primary key,
  badge_id text not null,
  church_id text not null,
  user_id text not null,
  unlocked_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_badges_user_badge_idx
  on public.user_badges (user_id, badge_id);

alter table public.user_badges enable row level security;
revoke all on public.user_badges from anon;
revoke all on public.user_badges from authenticated;
grant select, insert, update, delete on public.user_badges to authenticated;
drop policy if exists user_badges_isolation on public.user_badges;
create policy user_badges_isolation on public.user_badges
  using (church_id = current_setting('request.jwt.claims', true)::json->>'church_id')
  with check (church_id = current_setting('request.jwt.claims', true)::json->>'church_id');

create table if not exists public.monthly_rankings (
  id text primary key,
  church_id text not null,
  month text not null,
  user_id text not null,
  points integer not null default 0,
  services integer not null default 0,
  absences integer not null default 0,
  rank integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists monthly_rankings_church_month_idx
  on public.monthly_rankings (church_id, month, rank);

alter table public.monthly_rankings enable row level security;
revoke all on public.monthly_rankings from anon;
revoke all on public.monthly_rankings from authenticated;
grant select, insert, update, delete on public.monthly_rankings to authenticated;
drop policy if exists monthly_rankings_isolation on public.monthly_rankings;
create policy monthly_rankings_isolation on public.monthly_rankings
  using (church_id = current_setting('request.jwt.claims', true)::json->>'church_id')
  with check (church_id = current_setting('request.jwt.claims', true)::json->>'church_id');

commit;
