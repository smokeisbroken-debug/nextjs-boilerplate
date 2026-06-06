-- v59.27 Reward Snapshot Ledger Foundation
-- Purpose: prepare future Holder Rewards epochs and balance-share snapshot records.
-- Safe to run more than once.
-- This migration does NOT create token transfers, claims, staking, payouts, or Creator Fee distribution automation.

create table if not exists public.broke_reward_epochs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null default 'Reward Snapshot Prep',
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  snapshot_at timestamptz,
  volume_24h_usd numeric not null default 0,
  volume_trigger_usd numeric not null default 50000,
  max_creator_fee_pool_percent numeric not null default 50,
  minimum_hold_broke numeric not null default 100000,
  minimum_active_streak_days integer not null default 7,
  created_by text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broke_reward_epochs_status_check check (status in ('draft', 'active', 'snapshotted', 'closed', 'cancelled')),
  constraint broke_reward_epochs_pool_percent_check check (max_creator_fee_pool_percent >= 0 and max_creator_fee_pool_percent <= 50),
  constraint broke_reward_epochs_min_hold_check check (minimum_hold_broke >= 0),
  constraint broke_reward_epochs_min_streak_check check (minimum_active_streak_days >= 1)
);

create table if not exists public.broke_reward_snapshots (
  id uuid primary key default gen_random_uuid(),
  epoch_id uuid not null references public.broke_reward_epochs(id) on delete cascade,
  telegram_id bigint not null,
  wallet_address text,
  verified_balance numeric not null default 0,
  active_streak_days integer not null default 0,
  eligible boolean not null default false,
  ineligible_reason text,
  balance_share_percent numeric not null default 0,
  snapshot_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broke_reward_snapshots_balance_check check (verified_balance >= 0),
  constraint broke_reward_snapshots_streak_check check (active_streak_days >= 0),
  constraint broke_reward_snapshots_share_check check (balance_share_percent >= 0 and balance_share_percent <= 100),
  constraint broke_reward_snapshots_unique_holder unique (epoch_id, telegram_id)
);

create index if not exists broke_reward_epochs_status_idx
  on public.broke_reward_epochs (status, created_at desc);

create index if not exists broke_reward_snapshots_epoch_eligible_idx
  on public.broke_reward_snapshots (epoch_id, eligible, balance_share_percent desc);

create index if not exists broke_reward_snapshots_telegram_idx
  on public.broke_reward_snapshots (telegram_id, created_at desc);

create index if not exists broke_reward_snapshots_wallet_idx
  on public.broke_reward_snapshots (wallet_address)
  where wallet_address is not null;

alter table public.broke_reward_epochs enable row level security;
alter table public.broke_reward_snapshots enable row level security;

revoke all on table public.broke_reward_epochs from anon;
revoke all on table public.broke_reward_epochs from authenticated;
revoke all on table public.broke_reward_snapshots from anon;
revoke all on table public.broke_reward_snapshots from authenticated;

grant all on table public.broke_reward_epochs to service_role;
grant all on table public.broke_reward_snapshots to service_role;

comment on table public.broke_reward_epochs is 'Admin-controlled future Holder Rewards epochs. Ledger only; no token transfers or payouts.';
comment on table public.broke_reward_snapshots is 'Snapshot ledger rows for future Holder Rewards eligibility and balance-share calculations. Ledger only; no claims or payouts.';
comment on column public.broke_reward_snapshots.balance_share_percent is 'Eligible holder share = verified eligible BROKE balance / total verified eligible BROKE balance at snapshot time.';
