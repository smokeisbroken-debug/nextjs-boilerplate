-- v58.18 — post-RLS verification audit
-- This query changes nothing. Use it after v58.17 lockdown.

with target_tables(table_name) as (
  values
    ('broke_users'),
    ('broke_settings'),
    ('broke_expenses'),
    ('broke_streaks'),
    ('broke_challenges'),
    ('broke_user_challenges'),
    ('broke_user_badges'),
    ('broke_xp_events'),
    ('broke_leaderboard_profiles'),
    ('broke_exchange_rates'),
    ('broke_web_link_codes'),
    ('broke_community_messages'),
    ('broke_notification_logs')
), rls_status as (
  select
    tt.table_name,
    to_regclass('public.' || quote_ident(tt.table_name)) is not null as table_exists,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    coalesce(c.relforcerowsecurity, false) as rls_forced
  from target_tables tt
  left join pg_class c
    on c.oid = to_regclass('public.' || quote_ident(tt.table_name))
  left join pg_namespace n
    on n.oid = c.relnamespace
   and n.nspname = 'public'
), policy_summary as (
  select
    p.tablename as table_name,
    string_agg(p.policyname || ' [' || p.cmd || ']', ', ' order by p.policyname) as policies
  from pg_policies p
  where p.schemaname = 'public'
  group by p.tablename
)
select
  s.table_name,
  s.table_exists,
  s.rls_enabled,
  s.rls_forced,
  coalesce(ps.policies, '(no policies)') as policies
from rls_status s
left join policy_summary ps on ps.table_name = s.table_name
order by s.table_name;

-- Direct table grants. anon/authenticated should not appear for target tables.
select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'broke_users',
    'broke_settings',
    'broke_expenses',
    'broke_streaks',
    'broke_challenges',
    'broke_user_challenges',
    'broke_user_badges',
    'broke_xp_events',
    'broke_leaderboard_profiles',
    'broke_exchange_rates',
    'broke_web_link_codes',
    'broke_community_messages',
    'broke_notification_logs'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
group by table_name, grantee
order by table_name, grantee;

-- Required feature columns.
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'broke_settings' and column_name in ('settings_payload', 'app_state_payload'))
    or
    (table_name = 'broke_expenses' and column_name = 'currency')
  )
order by table_name, column_name;
