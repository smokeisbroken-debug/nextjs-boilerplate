-- v59.27 Reward Snapshot Ledger Audit
-- Run after the v59.27 migration to confirm tables, RLS, grants, and key columns.

select
  'broke_reward_epochs' as table_name,
  to_regclass('public.broke_reward_epochs') is not null as exists,
  coalesce((select relrowsecurity from pg_class where oid = 'public.broke_reward_epochs'::regclass), false) as rls_enabled
union all
select
  'broke_reward_snapshots' as table_name,
  to_regclass('public.broke_reward_snapshots') is not null as exists,
  coalesce((select relrowsecurity from pg_class where oid = 'public.broke_reward_snapshots'::regclass), false) as rls_enabled;

select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('broke_reward_epochs', 'broke_reward_snapshots')
order by table_name, ordinal_position;

select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('broke_reward_epochs', 'broke_reward_snapshots')
order by table_name, grantee, privilege_type;
