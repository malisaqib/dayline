-- Summaries now carry 2-3 grounded takeaways alongside the brief.
-- Existing rows (older prompt versions) keep an empty list; the cache key's
-- prompt_version keeps them from being reused by the new prompt.
alter table public.article_summaries
  add column takeaways jsonb not null default '[]'::jsonb
  check (jsonb_typeof(takeaways) = 'array');
