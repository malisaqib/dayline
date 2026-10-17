-- Phase 3: Supabase Cron calls the Vercel endpoint that generates every reader's daily edition.
-- No secrets here: the endpoint URL and bearer token live in Supabase Vault under the names
-- below and are stored by `npm run cron:setup` (see docs/daily-schedule.md).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Private schema: not exposed through the Data API.
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;

-- Fires one authorised POST and returns the pg_net request id (responses land in net._http_response).
create or replace function internal.trigger_daily_editions() returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  token text;
  request_id bigint;
begin
  select decrypted_secret into endpoint from vault.decrypted_secrets where name = 'dayline_daily_editions_url';
  select decrypted_secret into token from vault.decrypted_secrets where name = 'dayline_cron_secret';
  if endpoint is null or token is null then
    raise exception 'Vault secrets dayline_daily_editions_url and dayline_cron_secret must be set';
  end if;
  select net.http_post(
    url := endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || token),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  ) into request_id;
  return request_id;
end;
$$;

revoke all on function internal.trigger_daily_editions() from public, anon, authenticated;
