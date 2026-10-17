import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { deriveTopicWeights } from "@/domain/personalization/weights";
import type { TopicId } from "@/domain/topics";
import { ensureReader, type Reader } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { getPublicSupabaseEnv } from "@/server/env";
import { findEditionById } from "@/server/repositories/editions";
import { saveProfile } from "@/server/repositories/profiles";
import { getOrCreateDailyEdition } from "@/server/services/generate-edition";

// Live end-to-end check with two throwaway anonymous readers, deleted at the end.
function anonClient(): SupabaseClient {
  const env = getPublicSupabaseEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
}

function check(ok: boolean, label: string): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) {
    process.exitCode = 1;
  }
}

async function makeReader(topics: TopicId[]): Promise<{ db: SupabaseClient; reader: Reader }> {
  const db = anonClient();
  const reader = await ensureReader(db);
  await saveProfile(db, reader.id, topics, deriveTopicWeights(topics, []));
  return { db, reader };
}

async function main() {
  const readers: Reader[] = [];
  try {
    const a = await makeReader(["space", "science"]);
    const b = await makeReader(["pakistan", "world"]);
    readers.push(a.reader, b.reader);

    const [a1, a2] = await Promise.all([getOrCreateDailyEdition(a.db, a.reader), getOrCreateDailyEdition(a.db, a.reader)]);
    const a3 = await getOrCreateDailyEdition(a.db, a.reader);
    console.log(`reader A stats: ${JSON.stringify(a1.stats)}`);
    check(a1.edition.id === a2.edition.id && a2.edition.id === a3.edition.id, "concurrent + repeated generation return one edition");
    check(a3.stats.reused, "third request reuses the saved edition without regenerating");

    const bResult = await getOrCreateDailyEdition(b.db, b.reader);
    console.log(`reader B stats: ${JSON.stringify(bResult.stats)}`);
    const aTitles = a1.edition.stories.map((s) => s.title);
    const bTitles = bResult.edition.stories.map((s) => s.title);
    check(aTitles[0] !== bTitles[0], "two profiles get different lead stories");
    console.log(`  A lead: ${aTitles[0]}\n  B lead: ${bTitles[0]}`);

    check((await findEditionById(a.db, bResult.edition.id)) === null, "reader A cannot read reader B's edition (RLS)");
    check((await findEditionById(anonClient(), a1.edition.id)) === null, "a client with no session cannot read any edition");
    const { count } = await getSupabaseAdmin().from("editions").select("id", { count: "exact", head: true }).eq("user_id", a.reader.id);
    check(count === 1, `database holds exactly one edition for reader A today (found ${count})`);

    for (const story of a1.edition.stories) {
      console.log(`  A [${story.bodyKind}] ${story.sourceName}: ${story.title.slice(0, 70)}`);
    }
  } finally {
    const admin = getSupabaseAdmin();
    for (const reader of readers) {
      await admin.auth.admin.deleteUser(reader.id);
    }
    console.log(`cleanup: deleted ${readers.length} test readers (their profiles and editions cascade)`);
  }
}

main().catch((error: Error) => {
  console.error(`flow check failed: ${error.message}`);
  process.exit(1);
});
