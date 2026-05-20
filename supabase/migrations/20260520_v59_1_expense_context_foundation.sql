-- v59.1 Expense Context Foundation
-- Purpose: store Track Leak trigger chips as structured expense metadata instead of relying only on note hashtags.
-- Safe to run more than once.

alter table if exists public.broke_expenses
  add column if not exists trigger_tags text[] not null default '{}';

alter table if exists public.broke_expenses
  add column if not exists context_version integer not null default 1;

-- Keep trigger tags constrained to known app values.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'broke_expenses_trigger_tags_allowed'
      and conrelid = 'public.broke_expenses'::regclass
  ) then
    alter table public.broke_expenses
      add constraint broke_expenses_trigger_tags_allowed
      check (
        trigger_tags <@ array[
          'stress',
          'boredom',
          'impulse',
          'after-payday',
          'late-night',
          'social-pressure',
          'weekend',
          'habit'
        ]::text[]
      );
  end if;
end $$;

-- Backfill old hashtag notes into structured trigger_tags without changing note text.
update public.broke_expenses
set
  trigger_tags = array_remove(array[
    case when lower(coalesce(note, '')) like '%#stress%' then 'stress' end,
    case when lower(coalesce(note, '')) like '%#boredom%' then 'boredom' end,
    case when lower(coalesce(note, '')) like '%#impulse%' then 'impulse' end,
    case when lower(coalesce(note, '')) like '%#after-payday%' then 'after-payday' end,
    case when lower(coalesce(note, '')) like '%#late-night%' then 'late-night' end,
    case when lower(coalesce(note, '')) like '%#social-pressure%' then 'social-pressure' end,
    case when lower(coalesce(note, '')) like '%#weekend%' then 'weekend' end,
    case when lower(coalesce(note, '')) like '%#habit%' then 'habit' end
  ], null)::text[],
  context_version = greatest(context_version, 1)
where
  coalesce(array_length(trigger_tags, 1), 0) = 0
  and lower(coalesce(note, '')) similar to '%#(stress|boredom|impulse|after-payday|late-night|social-pressure|weekend|habit)%';

create index if not exists broke_expenses_trigger_tags_gin_idx
  on public.broke_expenses using gin (trigger_tags);

create index if not exists broke_expenses_context_lookup_idx
  on public.broke_expenses (telegram_id, created_at desc)
  where coalesce(array_length(trigger_tags, 1), 0) > 0;
