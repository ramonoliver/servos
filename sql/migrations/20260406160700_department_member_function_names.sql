begin;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'department_members'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'department_members'
      and column_name = 'function_names'
  ) then
    alter table public.department_members
      add column function_names text[] not null default '{}';

    update public.department_members
      set function_names = case
        when coalesce(trim(function_name), '') = '' then '{}'
        else array[trim(function_name)]
      end;
  end if;
end $$;

commit;
