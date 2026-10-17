-- Phase 1: profiles, shared article pool, summary cache, and per-reader editions.
-- Reader-owned tables are protected by RLS on auth.uid(). Shared tables (articles,
-- article_summaries) have RLS with no policies: only the server's secret key writes them.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  topics text[] not null check (cardinality(topics) between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner reads" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profiles: owner inserts" on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "profiles: owner updates" on public.profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Immutable article snapshots keyed by content hash. A changed article gets a new row.
create table public.articles (
  content_hash text primary key check (length(content_hash) = 64),
  source_id text not null,
  source_name text not null,
  title text not null,
  url text not null check (url ~ '^https?://'),
  published_at timestamptz,
  fetched_at timestamptz not null,
  text text not null,
  coverage text not null check (coverage in ('full', 'excerpt', 'none')),
  created_at timestamptz not null default now()
);

create index articles_source_published_idx on public.articles (source_id, published_at desc);
alter table public.articles enable row level security;

create function public.reject_update() returns trigger language plpgsql as $$
begin
  raise exception '% rows are immutable', tg_table_name;
end;
$$;

create trigger articles_immutable before update on public.articles
  for each row execute function public.reject_update();

-- Shared summary cache: one row per article content, model and prompt version.
create table public.article_summaries (
  content_hash text not null references public.articles (content_hash),
  model text not null,
  prompt_version text not null,
  brief text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  created_at timestamptz not null default now(),
  primary key (content_hash, model, prompt_version)
);

alter table public.article_summaries enable row level security;

create trigger article_summaries_immutable before update on public.article_summaries
  for each row execute function public.reject_update();

-- One daily edition per reader and local date. Stories are a frozen JSON snapshot.
create table public.editions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  timezone text not null,
  generated_at timestamptz not null default now(),
  sources_fetched_at timestamptz not null,
  profile_snapshot jsonb not null,
  stories jsonb not null,
  constraint editions_one_per_day unique (user_id, local_date)
);

create index editions_user_date_idx on public.editions (user_id, local_date desc);
alter table public.editions enable row level security;

create policy "editions: owner reads" on public.editions
  for select to authenticated using (user_id = (select auth.uid()));

create trigger editions_immutable before update on public.editions
  for each row execute function public.reject_update();
