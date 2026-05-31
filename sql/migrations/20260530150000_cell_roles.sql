begin;

-- Redes/Setores (agrupamento de células para supervisão).
create table if not exists public.cell_networks (
  id text primary key,
  church_id text not null,
  name text not null,
  description text not null default '',
  supervisor_ids text[] not null default '{}',
  color text not null default '#9B8CFB',
  created_at timestamptz not null default now()
);
create index if not exists cell_networks_church_id_idx on public.cell_networks (church_id);

-- Papel de células no usuário (visão da igreja toda).
alter table public.users add column if not exists cell_role text;

-- Liderança em listas (casais) + vínculo com a rede.
alter table public.cells add column if not exists leader_ids text[] not null default '{}';
alter table public.cells add column if not exists co_leader_ids text[] not null default '{}';
alter table public.cells add column if not exists network_id text;

-- Migrar ids únicos existentes para as listas (apenas quando ainda vazias).
update public.cells
  set leader_ids = array[leader_id]
  where leader_id is not null and coalesce(array_length(leader_ids, 1), 0) = 0;
update public.cells
  set co_leader_ids = array[co_leader_id]
  where co_leader_id is not null and coalesce(array_length(co_leader_ids, 1), 0) = 0;

alter table public.cell_networks disable row level security;
grant select, insert, update, delete on public.cell_networks to anon, authenticated;

commit;
