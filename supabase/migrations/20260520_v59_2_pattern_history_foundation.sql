-- v59.2 Pattern History Foundation
-- Purpose: store weekly Leak Pattern reads as structured history.
-- Safe to run more than once.

create table if not exists public.broke_pattern_history (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null,
  period_type text not null default 'weekly',
  period_key text not null,
  period_label text not null default 'Current week',
  tone text not null default 'quiet',
  headline text not null default 'Weekly pattern is forming',
  body text not null default 'Track more real leaks to build a reliable pattern history.',
  strongest_pattern text not null default 'No strong pattern yet',
  next_move text not null default 'Track the next real decision with context.',
  total_leaks numeric not null default 0,
  leak_pressure integer not null default 0,
  confidence text not null default 'Waiting',
  cards jsonb not null default '[]'::jsonb,
  summary_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broke_pattern_history_period_type_check check (period_type in ('weekly')),
  constraint broke_pattern_history_tone_check check (tone in ('quiet', 'watch', 'danger')),
  constraint broke_pattern_history_confidence_check check (confidence in ('Waiting', 'Learning', 'Clear')),
  constraint broke_pattern_history_leak_pressure_check check (leak_pressure >= 0 and leak_pressure <= 100),
  constraint broke_pattern_history_unique_period unique (telegram_id, period_type, period_key)
);

create index if not exists broke_pattern_history_telegram_period_idx
  on public.broke_pattern_history (telegram_id, period_type, period_key desc);

create index if not exists broke_pattern_history_updated_idx
  on public.broke_pattern_history (updated_at desc);

alter table public.broke_pattern_history enable row level security;

revoke all on table public.broke_pattern_history from anon;
revoke all on table public.broke_pattern_history from authenticated;
grant all on table public.broke_pattern_history to service_role;

comment on table public.broke_pattern_history is 'Structured weekly Leak Pattern history saved server-side for future behavior comparison, reports, and notifications.';
comment on column public.broke_pattern_history.summary_payload is 'Full normalized weekly pattern summary payload used for backward-compatible future reads.';
