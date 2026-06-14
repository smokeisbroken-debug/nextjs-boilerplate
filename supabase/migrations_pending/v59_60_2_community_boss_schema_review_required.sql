-- v59.60.2 — Community Boss Supabase Migration Review / Apply Prep
-- STATUS: PENDING MANUAL REVIEW. Do not auto-apply.
-- Apply only after checking docs/v59-60-2-community-boss-migration-review-apply-prep.md.
-- This migration creates public-safe Community Boss tables only.
-- It must not be used for payouts, wallet value, balances, income, debt, or PvP.

-- v59.60.0 — Community Boss Backend Schema Draft
-- Status: DRAFT ONLY. Do not apply automatically.
-- Purpose: prepare a public-safe backend for Community Boss aggregate progress.
-- Guardrails: no wallet value, no balances, no income, no debt, no payout math, no PvP.

-- Required extension for gen_random_uuid().
create extension if not exists pgcrypto;

-- 1. Weekly boss identity/state.
create table if not exists public.broke_community_boss_weeks (
  week_key text primary key,
  boss_code text not null,
  boss_name text not null,
  week_start_date date not null,
  week_end_date date not null,
  status text not null default 'draft',
  boss_hp integer not null default 1000,
  phase_label text not null default 'Stable leak',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint broke_community_boss_weeks_week_key_check
    check (week_key ~ '^[0-9]{4}-W[0-9]{2}$'),

  constraint broke_community_boss_weeks_status_check
    check (status in ('draft', 'open', 'closed', 'archived')),

  constraint broke_community_boss_weeks_boss_hp_check
    check (boss_hp between 1 and 100000),

  constraint broke_community_boss_weeks_date_check
    check (week_end_date >= week_start_date)
);

-- 2. One safe proof row per user per week.
-- This stores only public-safe proof summary, not private financial data.
create table if not exists public.broke_community_boss_user_proofs (
  id uuid primary key default gen_random_uuid(),
  week_key text not null references public.broke_community_boss_weeks(week_key) on delete cascade,

  -- Server-side identity. Do not expose raw rows publicly.
  telegram_user_id text not null,

  -- Public-safe identity shown only when user opted into public proof.
  public_handle text,
  public_display_name text,

  -- Safe proof numbers.
  weekly_damage integer not null default 0,
  safe_points integer not null default 0,
  proof_count integer not null default 0,

  -- Safe mascot summary.
  mascot_stage integer not null default 1,
  mascot_power_bucket text not null default 'low',
  badge_count integer not null default 0,

  -- Safe action flags/counts.
  routine_completed boolean not null default false,
  tracking_days integer not null default 0,
  challenge_completed boolean not null default false,
  weakness_hit boolean not null default false,

  -- Optional integrity marker for future duplicate/fraud checks.
  proof_hash text,

  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint broke_community_boss_user_proofs_unique_user_week
    unique (week_key, telegram_user_id),

  constraint broke_community_boss_user_proofs_weekly_damage_check
    check (weekly_damage between 0 and 10000),

  constraint broke_community_boss_user_proofs_safe_points_check
    check (safe_points between 0 and 10000),

  constraint broke_community_boss_user_proofs_proof_count_check
    check (proof_count between 0 and 20),

  constraint broke_community_boss_user_proofs_mascot_stage_check
    check (mascot_stage between 1 and 5),

  constraint broke_community_boss_user_proofs_mascot_power_bucket_check
    check (mascot_power_bucket in ('low', 'medium', 'high', 'legend')),

  constraint broke_community_boss_user_proofs_badge_count_check
    check (badge_count between 0 and 50),

  constraint broke_community_boss_user_proofs_tracking_days_check
    check (tracking_days between 0 and 7),

  constraint broke_community_boss_user_proofs_public_handle_check
    check (public_handle is null or public_handle ~ '^[A-Za-z0-9_\\.\\-]{2,32}$')
);

-- 3. Cached public aggregate.
create table if not exists public.broke_community_boss_aggregates (
  week_key text primary key references public.broke_community_boss_weeks(week_key) on delete cascade,
  total_damage bigint not null default 0,
  total_safe_points bigint not null default 0,
  participant_count integer not null default 0,
  routine_count integer not null default 0,
  challenge_count integer not null default 0,
  weakness_hit_count integer not null default 0,
  tracking_day_total integer not null default 0,
  updated_at timestamptz not null default now(),

  constraint broke_community_boss_aggregates_total_damage_check
    check (total_damage >= 0),

  constraint broke_community_boss_aggregates_total_safe_points_check
    check (total_safe_points >= 0),

  constraint broke_community_boss_aggregates_participant_count_check
    check (participant_count >= 0)
);

-- 4. Server-only audit events.
create table if not exists public.broke_community_boss_audit_events (
  id uuid primary key default gen_random_uuid(),
  week_key text references public.broke_community_boss_weeks(week_key) on delete set null,
  event_type text not null,
  actor_label text,
  detail text,
  created_at timestamptz not null default now(),

  constraint broke_community_boss_audit_events_event_type_check
    check (event_type in (
      'week_created',
      'week_opened',
      'week_closed',
      'proof_upserted',
      'aggregate_recalculated',
      'proof_rejected',
      'admin_note'
    ))
);

create index if not exists broke_community_boss_weeks_status_idx
  on public.broke_community_boss_weeks(status, week_start_date desc);

create index if not exists broke_community_boss_user_proofs_week_idx
  on public.broke_community_boss_user_proofs(week_key, updated_at desc);

create index if not exists broke_community_boss_user_proofs_telegram_idx
  on public.broke_community_boss_user_proofs(telegram_user_id, week_key desc);

create index if not exists broke_community_boss_audit_week_idx
  on public.broke_community_boss_audit_events(week_key, created_at desc);

-- Public-safe aggregate view.
-- This view intentionally excludes raw user proof rows.
create or replace view public.broke_community_boss_public_weeks as
select
  w.week_key,
  w.boss_code,
  w.boss_name,
  w.week_start_date,
  w.week_end_date,
  w.status,
  w.boss_hp,
  w.phase_label,
  coalesce(a.total_damage, 0) as total_damage,
  coalesce(a.total_safe_points, 0) as total_safe_points,
  coalesce(a.participant_count, 0) as participant_count,
  coalesce(a.routine_count, 0) as routine_count,
  coalesce(a.challenge_count, 0) as challenge_count,
  coalesce(a.weakness_hit_count, 0) as weakness_hit_count,
  coalesce(a.updated_at, w.updated_at) as aggregate_updated_at
from public.broke_community_boss_weeks w
left join public.broke_community_boss_aggregates a on a.week_key = w.week_key;

-- RLS draft.
alter table public.broke_community_boss_weeks enable row level security;
alter table public.broke_community_boss_user_proofs enable row level security;
alter table public.broke_community_boss_aggregates enable row level security;
alter table public.broke_community_boss_audit_events enable row level security;

-- If using PostgREST public anon reads, allow read-only public access to weeks/aggregates.
-- Raw user proofs and audit events should stay server-only.
drop policy if exists broke_community_boss_weeks_public_read
  on public.broke_community_boss_weeks;
create policy broke_community_boss_weeks_public_read
  on public.broke_community_boss_weeks
  for select
  using (status in ('open', 'closed', 'archived'));

drop policy if exists broke_community_boss_aggregates_public_read
  on public.broke_community_boss_aggregates;
create policy broke_community_boss_aggregates_public_read
  on public.broke_community_boss_aggregates
  for select
  using (true);

-- No anon/client policy for user proofs or audit events in the draft.
-- Next.js API should use the service role key and strict server validation for writes.
