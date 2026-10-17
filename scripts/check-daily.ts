import { createClient } from "@supabase/supabase-js";
import type { TopicWeights } from "@/domain/personalization/weights";
import { ensureReader, type Reader } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { getPublicSupabaseEnv } from "@/server/env";
import { localEditionDate } from "@/domain/editions/edition";
import { saveProfile } from "@/server/repositories/profiles";
import { runDailyEditionJob } from "@/server/services/daily-job";

// Live check of the scheduled job against the real database, using two throwaway
// anonymous readers (deleted at the end). It also generates today's edition for any
// existing reader who lacks one, which is exactly what the scheduled run does.
function check(ok: boolean, label: string): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) {
    process.exitCode = 1;
  }
}

async function main() {
  const env = getPublicSupabaseEnv();
  const admin = getSupabaseAdmin();
  const readers: Reader[] = [];
  try {
    // Reader A has learned weights (as if after feedback); reader B has none yet.
    const weightsA: TopicWeights = { technology: 0.5, security: 1.75 };
    for (const [topics, weights] of [
      [["technology", "security"], weightsA],
      [["world"], { world: 1 }],
    ] as const) {
      const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
      const reader = await ensureReader(db);
      await saveProfile(db, reader.id, [...topics], weights);
      readers.push(reader);
    }
    const [a, b] = readers;
    const today = localEditionDate(new Date());

    const first = await runDailyEditionJob();
    console.log(`run 1: ${JSON.stringify(first)}`);
    check(first.created >= 2, "first run created editions for the two new readers (and any reader missing today's)");

    const editionOf = async (userId: string) =>
      (await admin.from("editions").select("id, profile_snapshot, stories").eq("user_id", userId).eq("local_date", today)).data ?? [];
    const [editionA] = await editionOf(a.id);
    check(Boolean(editionA) && (await editionOf(b.id)).length === 1, "each test reader has exactly one edition for today");
    // JSONB does not preserve key order, so compare sorted entries.
    const sorted = (w: object | undefined) => JSON.stringify(Object.entries(w ?? {}).sort());
    check(sorted(editionA?.profile_snapshot?.weights) === sorted(weightsA), `scheduled edition used reader A's saved weights (${JSON.stringify(editionA?.profile_snapshot?.weights)})`);

    const second = await runDailyEditionJob();
    console.log(`run 2: ${JSON.stringify(second)}`);
    check(second.created === 0 && second.failed === 0 && second.reused === second.examined, "second run reused every edition and created none");
    const again = await editionOf(a.id);
    check(again.length === 1 && again[0].id === editionA.id && JSON.stringify(again[0].stories) === JSON.stringify(editionA.stories), "reader A still has the same single, unchanged edition");

    const tamper = await admin.from("editions").update({ stories: [] }).eq("id", editionA.id);
    check(tamper.error !== null, `saved edition rejects updates even with the secret key (${tamper.error?.message ?? "no error"})`);
  } finally {
    for (const reader of readers) {
      await admin.auth.admin.deleteUser(reader.id);
    }
    console.log(`cleanup: deleted ${readers.length} test readers`);
  }
}

main().catch((error: Error) => {
  console.error(`daily check failed: ${error.message}`);
  process.exit(1);
});
