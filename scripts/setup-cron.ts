import postgres from "postgres";
import { getCronEnv, getDatabaseEnv } from "@/server/env";

/*
 * Stores the endpoint URL and CRON_SECRET in Supabase Vault and (re)registers the daily
 * cron job. Idempotent. Never prints secret values.
 *   npm run cron:setup              store secrets + schedule
 *   npm run cron:setup -- --trigger also fire one run now and print the HTTP result
 * DAILY_EDITIONS_URL overrides the default production endpoint.
 */
const JOB_NAME = "dayline-daily-editions";
// 06:00 Asia/Karachi (UTC+5, no daylight saving) = 01:00 UTC.
const SCHEDULE = "0 1 * * *";
const ENDPOINT = process.env.DAILY_EDITIONS_URL ?? "https://dayline-swart.vercel.app/api/internal/daily-editions";
const RESPONSE_WAIT_MS = 120_000;

async function upsertVaultSecret(sql: postgres.Sql, name: string, value: string): Promise<void> {
  const [existing] = await sql<{ id: string }[]>`select id from vault.secrets where name = ${name}`;
  if (existing) {
    await sql`select vault.update_secret(${existing.id}::uuid, ${value})`;
  } else {
    await sql`select vault.create_secret(${value}, ${name})`;
  }
}

async function main() {
  const sql = postgres(getDatabaseEnv().SUPABASE_DB_URL, { max: 1, onnotice: () => {} });
  try {
    await upsertVaultSecret(sql, "dayline_daily_editions_url", ENDPOINT);
    await upsertVaultSecret(sql, "dayline_cron_secret", getCronEnv().CRON_SECRET);
    console.log(`vault: dayline_daily_editions_url -> ${ENDPOINT}; dayline_cron_secret stored (value not shown)`);

    await sql`select cron.schedule(${JOB_NAME}, ${SCHEDULE}, 'select internal.trigger_daily_editions()')`;
    const jobs = await sql`select jobname, schedule, active from cron.job where jobname = ${JOB_NAME}`;
    console.log(`cron: ${JSON.stringify(jobs)} (06:00 Asia/Karachi = 01:00 UTC)`);

    if (process.argv.includes("--trigger")) {
      const [{ id }] = await sql<{ id: string }[]>`select internal.trigger_daily_editions() as id`;
      console.log(`triggered pg_net request ${id}; waiting for the response...`);
      const deadline = Date.now() + RESPONSE_WAIT_MS;
      for (;;) {
        const [response] = await sql`select status_code, content, error_msg, timed_out from net._http_response where id = ${id}`;
        if (response) {
          console.log(`response: HTTP ${response.status_code} ${response.content ?? ""}${response.error_msg ? ` error: ${response.error_msg}` : ""}`);
          break;
        }
        if (Date.now() > deadline) {
          console.log("no response recorded yet; check net._http_response later");
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } finally {
    await sql.end();
  }
}

main().catch((error: Error) => {
  console.error(`cron setup failed: ${error.message}`);
  process.exit(1);
});
