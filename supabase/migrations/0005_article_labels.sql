-- Internet Pulse: compact source-supplied metadata (e.g. CVE id, alert level) per article snapshot.
alter table public.articles
  add column if not exists labels text[] not null default '{}';
