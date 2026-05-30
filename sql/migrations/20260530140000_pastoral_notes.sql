begin;

-- Cuidado pastoral / timeline por pessoa (pessoa = users.id).
create table if not exists public.pastoral_notes (
  id text primary key,
  church_id text not null,
  person_id text not null,
  author_id text,
  type text not null default 'note',
  title text not null default '',
  description text not null default '',
  date text not null,
  created_at timestamptz not null default now()
);

create index if not exists pastoral_notes_person_id_idx on public.pastoral_notes (person_id);
create index if not exists pastoral_notes_church_id_idx on public.pastoral_notes (church_id);

alter table public.pastoral_notes disable row level security;

grant select, insert, update, delete on public.pastoral_notes to anon, authenticated;

commit;
