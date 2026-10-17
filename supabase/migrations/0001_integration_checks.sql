-- Phase 0: a scratch table used only to prove database write/read/delete.
-- RLS is enabled with no policies, so only the server's secret key can touch it.
create table if not exists public.integration_checks (
  id uuid primary key default gen_random_uuid(),
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.integration_checks enable row level security;
