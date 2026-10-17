-- "Today in three": up to three grounded one-line highlights, frozen with the edition at insert time.
-- Items reference stories by article hash; older editions keep an empty list.
alter table public.editions
  add column if not exists today_in_three jsonb not null default '[]'::jsonb
  check (jsonb_typeof(today_in_three) = 'array');
