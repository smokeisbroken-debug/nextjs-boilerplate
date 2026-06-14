-- v59.60.4 — Community Boss Seed Current Week Manual SQL
-- Status: MANUAL REVIEW/APPLY ONLY. Do not auto-run.
-- Purpose: seed the current weekly Community Boss metadata and zero aggregate row.
-- Guardrails: no user proof rows, no wallet value, no balance, no income/debt, no payout math, no PvP.

with boss_rotation(position, boss_code, boss_name) as (
  values
    (1, 'subscription-leech', 'Subscription Leech'),
    (2, 'impulse-goblin', 'Impulse Goblin'),
    (3, 'weekend-drain', 'Weekend Drain'),
    (4, 'phantom-fee', 'Phantom Fee'),
    (5, 'delivery-demon', 'Delivery Demon'),
    (6, 'fomo-hydra', 'FOMO Hydra')
), current_week as (
  select
    to_char(current_date, 'IYYY-"W"IW') as week_key,
    date_trunc('week', current_date)::date as week_start_date,
    (date_trunc('week', current_date)::date + interval '6 days')::date as week_end_date,
    extract(week from current_date)::int as iso_week_number
), selected_boss as (
  select
    cw.week_key,
    cw.week_start_date,
    cw.week_end_date,
    br.boss_code,
    br.boss_name
  from current_week cw
  join boss_rotation br on br.position = ((cw.iso_week_number % 6) + 1)
), seeded_week as (
  insert into public.broke_community_boss_weeks (
    week_key,
    boss_code,
    boss_name,
    week_start_date,
    week_end_date,
    status,
    boss_hp,
    phase_label
  )
  select
    week_key,
    boss_code,
    boss_name,
    week_start_date,
    week_end_date,
    'open',
    100000,
    'Backend prep'
  from selected_boss
  on conflict (week_key) do update set
    boss_code = excluded.boss_code,
    boss_name = excluded.boss_name,
    week_start_date = excluded.week_start_date,
    week_end_date = excluded.week_end_date,
    status = excluded.status,
    boss_hp = excluded.boss_hp,
    phase_label = excluded.phase_label,
    updated_at = now()
  returning week_key
)
insert into public.broke_community_boss_aggregates (
  week_key,
  total_damage,
  total_safe_points,
  participant_count,
  routine_count,
  challenge_count,
  weakness_hit_count,
  tracking_day_total
)
select
  week_key,
  0,
  0,
  0,
  0,
  0,
  0,
  0
from seeded_week
on conflict (week_key) do nothing;
