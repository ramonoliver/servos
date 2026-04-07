begin;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'departments'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'departments'
      and column_name = 'function_names'
  ) then
    alter table public.departments
      add column function_names text[] not null default '{}';
  end if;
end $$;

commit;
