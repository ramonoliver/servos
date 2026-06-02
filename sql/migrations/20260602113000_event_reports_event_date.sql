begin;

alter table public.event_reports
  add column if not exists event_date text not null default '';

alter table public.event_reports
  add column if not exists reconciliations_count integer not null default 0,
  add column if not exists prayer_requests_count integer not null default 0,
  add column if not exists people_followed_count integer not null default 0;

alter table public.event_reports
  drop constraint if exists event_reports_church_id_event_id_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_reports_church_id_event_id_event_date_key'
  ) then
    alter table public.event_reports
      add constraint event_reports_church_id_event_id_event_date_key unique (church_id, event_id, event_date);
  end if;
end $$;

create index if not exists event_reports_event_date_idx on public.event_reports (event_date);

commit;
