-- v59.1 Expense Context Foundation audit
-- Run after the migration.

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'broke_expenses'
  and column_name in ('trigger_tags', 'context_version', 'note', 'currency')
order by column_name;

select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.broke_expenses'::regclass
  and conname = 'broke_expenses_trigger_tags_allowed';

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'broke_expenses'
  and indexname in ('broke_expenses_trigger_tags_gin_idx', 'broke_expenses_context_lookup_idx')
order by indexname;

select
  count(*) as total_expenses,
  count(*) filter (where coalesce(array_length(trigger_tags, 1), 0) > 0) as expenses_with_structured_triggers,
  count(*) filter (where lower(coalesce(note, '')) like '%#%' and coalesce(array_length(trigger_tags, 1), 0) = 0) as hashtag_notes_without_structured_triggers
from public.broke_expenses;
