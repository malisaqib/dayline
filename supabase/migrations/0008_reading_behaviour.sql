-- Learning from reading behaviour: skips and opened originals, plus the source of More/Less signals.
-- One row per reader + edition + story + kind, so an open or skip counts once. Readers may delete
-- their own rows (undo a skip). Inserts must reference an edition the reader owns.

alter table public.feedback_events add column if not exists source_id text;

create table if not exists public.reading_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  edition_id uuid not null references public.editions (id) on delete cascade,
  article_hash text not null check (length(article_hash) = 64),
  article_url text not null check (article_url ~ '^https?://'),
  source_id text not null,
  topics text[] not null check (cardinality(topics) between 1 and 5),
  kind text not null check (kind in ('open', 'skip')),
  created_at timestamptz not null default now(),
  constraint reading_events_once unique (user_id, edition_id, article_hash, kind)
);

create index if not exists reading_events_user_created_idx on public.reading_events (user_id, created_at desc);

alter table public.reading_events enable row level security;

drop policy if exists "reading: owner reads" on public.reading_events;
create policy "reading: owner reads" on public.reading_events
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "reading: owner inserts on own edition" on public.reading_events;
create policy "reading: owner inserts on own edition" on public.reading_events
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.editions e where e.id = edition_id and e.user_id = (select auth.uid()))
  );

drop policy if exists "reading: owner deletes" on public.reading_events;
create policy "reading: owner deletes" on public.reading_events
  for delete to authenticated using (user_id = (select auth.uid()));
