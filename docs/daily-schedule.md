# Daily edition schedule

Every morning Supabase Cron calls the production endpoint, which generates and saves today's edition for every reader who has a profile. Readers who open the site before the run, or who sign up after it, still get their paper on demand. Both paths use the same `getOrCreateDailyEdition`, and the database allows one edition per reader per day.

| | |
|---|---|
| Schedule | `0 1 * * *`: **01:00 UTC = 06:00 Asia/Karachi** (PKT is UTC+5 with no daylight saving) |
| Endpoint | `POST https://dayline-swart.vercel.app/api/internal/daily-editions` |
| Auth | `Authorization: Bearer <CRON_SECRET>`. Missing or wrong token returns 401 |
| Response | `{ localDate, examined, created, reused, failed, durationMs }`: counts only |
| Edition date | `Asia/Karachi` local date (the existing convention) |

## Pieces

- `src/app/api/internal/daily-editions/route.ts`: thin route; bearer check in `src/server/services/daily-job-handler.ts`.
- `src/server/services/daily-job.ts`: profiles in pages of 100, 3 readers at a time, one shared article fetch, failures isolated per reader.
- `supabase/migrations/0006_daily_edition_schedule.sql`: enables `pg_cron` and `pg_net`, and adds the private function `internal.trigger_daily_editions()`. That function reads the URL and token from Vault and sends the POST. No secrets are stored in the migration.
- `scripts/setup-cron.ts` (`npm run cron:setup`): stores both Vault secrets from `.env.local` and registers the cron job. It is idempotent and never prints the secret.

## Setup

1. Generate a secret of 32+ random characters, e.g. `node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"`. Put it in `.env.local` as `CRON_SECRET=...`.
2. Vercel → Project → Settings → Environment Variables → **Production**: add `CRON_SECRET` with the same value, then redeploy. `GET /api/health` shows `"cron":{"valid":true}` when it is set.
3. `npm run db:migrate`, which applies 0006.
4. `npm run cron:setup`, which stores the Vault secrets and schedules the job.
5. Verify with one run now: `npm run cron:setup -- --trigger`. It prints the HTTP status and counts from `net._http_response`.

Equivalent SQL for the Supabase SQL editor (replace the placeholder; never commit the real value):

```sql
select vault.create_secret('https://dayline-swart.vercel.app/api/internal/daily-editions', 'dayline_daily_editions_url');
select vault.create_secret('<CRON_SECRET>', 'dayline_cron_secret');
select cron.schedule('dayline-daily-editions', '0 1 * * *', 'select internal.trigger_daily_editions()');
```

## Operating

- Run now: `select internal.trigger_daily_editions();` (SQL editor) or `npm run cron:setup -- --trigger`.
- History: `select * from cron.job_run_details order by start_time desc limit 5;`, plus `select id, status_code, content from net._http_response order by created desc limit 5;`.
- Pause: `select cron.unschedule('dayline-daily-editions');`.
- Rotate the secret: update `.env.local` and Vercel, redeploy, then rerun `npm run cron:setup`.
- Checks: `npm run check:daily` (job against the live database) and `BASE_URL=... npm run check:scheduled` (HTTP endpoint, 401s, idempotency, reader opens the scheduled paper via today's paper, archive and PDF). `check:scheduled` needs the same `CRON_SECRET` as the target deployment.

## Limits

- One run must finish within Vercel's 300 s function limit. A run for 33 readers took about 5 s, because feeds are fetched once and summaries are cached. Thousands of readers would need batching, e.g. a cursor parameter or a queue.
- pg_net waits up to 300 s for the response. A failed run is not retried automatically; the next morning's run, or a reader opening the site, fills the gap.
