-- v59.2 Pattern History Foundation audit
-- Run after the migration. This should return one row for the table plus key column/security checks.

select
  'table_exists' as check_name,
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'broke_pattern_history'
  ) as ok;

select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'broke_pattern_history'
order by c.ordinal_position;

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'broke_pattern_history';

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'broke_pattern_history'
order by grantee, privilege_type;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'broke_pattern_history'
order by indexname;
