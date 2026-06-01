begin;

-- Add birth_date to users table
alter table public.users
  add column if not exists birth_date date;

-- Add granular address columns
alter table public.users
  add column if not exists address_cep         text not null default '',
  add column if not exists address_street      text not null default '',
  add column if not exists address_number      text not null default '',
  add column if not exists address_complement  text not null default '',
  add column if not exists address_neighborhood text not null default '',
  add column if not exists address_city        text not null default '',
  add column if not exists address_state       text not null default '';

-- Index for birthday queries (month + day ignoring year)
create index if not exists users_birth_month_day_idx
  on public.users (
    extract(month from birth_date),
    extract(day   from birth_date)
  )
  where birth_date is not null;

-- Helper function used by the birthday-notifications cron endpoint
create or replace function public.get_birthday_users(p_month int, p_day int)
returns table (id text, name text, church_id text)
language sql
stable
security definer
as $$
  select id, name, church_id
  from public.users
  where active = true
    and birth_date is not null
    and extract(month from birth_date) = p_month
    and extract(day   from birth_date) = p_day;
$$;

grant execute on function public.get_birthday_users(int, int) to anon;
grant execute on function public.get_birthday_users(int, int) to authenticated;

commit;
