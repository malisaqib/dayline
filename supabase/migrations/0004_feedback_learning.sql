-- Phase 2: explicit reader feedback and derived topic weights.
-- Weights are recomputed from stored signals (see domain/personalization/weights.ts),
-- so profiles.topic_weights is a cache of that derivation, never a click counter.

alter table public.profiles
  add column if not exists topic_weights jsonb not null default '{}'::jsonb;

-- Backfill: every selected topic starts at the 1.0 baseline.
update public.profiles p
set topic_weights = (select jsonb_object_agg(t, 1.0) from unnest(p.topics) as t)
where p.topic_weights = '{}'::jsonb;

create table if not exists public.feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  edition_id uuid not null references public.editions (id) on delete cascade,
  article_hash text not null check (length(article_hash) = 64),
  -- Topics copied from the server-side edition snapshot, never from the browser.
  topics text[] not null check (cardinality(topics) between 1 and 5),
  signal text not null check (signal in ('more', 'less')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One current signal per reader, edition and story; changing it updates this row.
  constraint feedback_one_signal_per_story unique (user_id, edition_id, article_hash)
);

-- Weight derivation reads all of a reader's signals; the edition page reads one edition's.
create index if not exists feedback_user_updated_idx on public.feedback_events (user_id, updated_at desc);

alter table public.feedback_events enable row level security;

drop policy if exists "feedback: owner reads" on public.feedback_events;
create policy "feedback: owner reads" on public.feedback_events
  for select to authenticated using (user_id = (select auth.uid()));

-- Inserts and updates must reference an edition the same reader owns.
drop policy if exists "feedback: owner inserts on own edition" on public.feedback_events;
create policy "feedback: owner inserts on own edition" on public.feedback_events
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.editions e where e.id = edition_id and e.user_id = (select auth.uid()))
  );

drop policy if exists "feedback: owner updates on own edition" on public.feedback_events;
create policy "feedback: owner updates on own edition" on public.feedback_events
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.editions e where e.id = edition_id and e.user_id = (select auth.uid()))
  );
