import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";
import { localEditionDate } from "@/domain/editions/edition";
import { deriveTopicWeights } from "@/domain/personalization/weights";
import { ensureReader } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { getCronEnv, getPublicSupabaseEnv } from "@/server/env";
import { saveProfile } from "@/server/repositories/profiles";

/*
 * End-to-end check of the scheduled path against a running app (local or deployed):
 * 401s for bad tokens, then a reader with no edition gets one from the HTTP job, opens it via
 * "Open today's paper", the archive and the PDF, and a second run creates nothing.
 * Usage: BASE_URL=http://localhost:3100 npm run check:scheduled  (needs CRON_SECRET in .env.local)
 */
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const ENDPOINT = `${BASE_URL}/api/internal/daily-editions`;

let failures = 0;
function check(ok: boolean, label: string): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  failures += ok ? 0 : 1;
}

async function trigger(authorization?: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(ENDPOINT, { method: "POST", headers: authorization ? { authorization } : {} });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function main() {
  const env = getPublicSupabaseEnv();
  const secret = getCronEnv().CRON_SECRET;
  const admin = getSupabaseAdmin();

  check((await trigger()).status === 401, "no authorization -> 401");
  check((await trigger(`Bearer ${"x".repeat(secret.length)}`)).status === 401, "wrong token -> 401");

  // An anonymous reader with a profile but no edition, signed in through the same cookie format the app uses.
  const jar = new Map<string, string>();
  const db = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (set) => set.forEach((c) => jar.set(c.name, c.value)) },
  });
  const reader = await ensureReader(db);
  try {
    await saveProfile(db, reader.id, ["security", "disasters"], deriveTopicWeights(["security", "disasters"], []));
    const today = localEditionDate(new Date());

    const run1 = await trigger(`Bearer ${secret}`);
    console.log(`run 1: HTTP ${run1.status} ${JSON.stringify(run1.body)}`);
    check(run1.status === 200 && Number(run1.body.created) >= 1, "authorized run creates the missing edition");
    check(!JSON.stringify(run1.body).includes(reader.id) && !JSON.stringify(run1.body).includes(secret), "response holds counts only (no reader ids, no secret)");
    const { data: rows } = await admin.from("editions").select("id").eq("user_id", reader.id).eq("local_date", today);
    check(rows?.length === 1, "reader has exactly one edition for today, created by the job");
    const scheduledId = rows?.[0]?.id as string;

    const run2 = await trigger(`Bearer ${secret}`);
    console.log(`run 2: HTTP ${run2.status} ${JSON.stringify(run2.body)}`);
    check(run2.status === 200 && run2.body.created === 0 && run2.body.reused === run2.body.examined, "second run creates nothing (all reused)");

    const browser = await chromium.launch();
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: BASE_URL })));
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/today`);
    await page.getByRole("link", { name: "Open today's paper" }).click();
    await page.waitForURL(/\/edition\//, { timeout: 60_000 });
    check(page.url().endsWith(scheduledId), "'Open today's paper' opens the scheduled edition");
    await page.goto(`${BASE_URL}/archive`);
    check((await page.locator(`a[href="/edition/${scheduledId}"]`).count()) === 1, "archive lists the scheduled edition");
    const pdf = await context.request.get(`${BASE_URL}/api/editions/${scheduledId}/pdf`);
    check(pdf.status() === 200 && pdf.headers()["content-type"] === "application/pdf", `scheduled edition PDF downloads (HTTP ${pdf.status()})`);
    await browser.close();
  } finally {
    await admin.auth.admin.deleteUser(reader.id);
    console.log("cleanup: deleted the test reader");
  }
  console.log(failures === 0 ? "\nSCHEDULED CHECK PASSED" : `\nSCHEDULED CHECK FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: Error) => {
  console.error(`scheduled check crashed: ${error.message}`);
  process.exit(1);
});
