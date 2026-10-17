import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { deriveTopicWeights } from "@/domain/personalization/weights";
import type { TopicId } from "@/domain/topics";
import { ensureReader, type Reader } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { getPublicSupabaseEnv } from "@/server/env";
import { findEditionById } from "@/server/repositories/editions";
import { findProfile } from "@/server/repositories/profiles";
import { FeedbackError, recordFeedback, recordReading, undoSkip } from "@/server/services/feedback";
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

    // Phase 2: feedback learning against the live database.
    const before = JSON.stringify(await findEditionById(a.db, a1.edition.id));
    const target = a1.edition.stories[0];
    const input = { editionId: a1.edition.id, articleHash: target.articleHash };
    const first = await recordFeedback(a.db, a.reader, { ...input, signal: "more" });
    const repeat = await recordFeedback(a.db, a.reader, { ...input, signal: "more" });
    check(JSON.stringify(first.weights) === JSON.stringify(repeat.weights), `same signal twice has one effect (${JSON.stringify(repeat.weights)})`);
    const switched = await recordFeedback(a.db, a.reader, { ...input, signal: "less" });
    check(target.topics.every((t) => switched.weights[t] === 0.75), `more -> less replaces the effect (${JSON.stringify(switched.weights)})`);
    const stored = await findProfile(a.db, a.reader.id);
    check(JSON.stringify(stored?.weights) === JSON.stringify(switched.weights), "derived weights are saved on the profile");
    const { count: rows } = await getSupabaseAdmin().from("feedback_events").select("id", { count: "exact", head: true }).eq("user_id", a.reader.id);
    check(rows === 1, `one stored signal row for the story (found ${rows})`);
    check(JSON.stringify(await findEditionById(a.db, a1.edition.id)) === before, "saved edition is unchanged after feedback");

    const crossTarget = { editionId: bResult.edition.id, articleHash: bResult.edition.stories[0].articleHash, signal: "more" as const };
    const cross = await recordFeedback(a.db, a.reader, crossTarget).then(() => "accepted", (e) => (e instanceof FeedbackError ? "rejected" : `error ${e}`));
    check(cross === "rejected", "service rejects feedback on another reader's edition");
    const direct = await a.db.from("feedback_events").insert({
      user_id: a.reader.id,
      edition_id: bResult.edition.id,
      article_hash: crossTarget.articleHash,
      topics: ["world"],
      signal: "more",
    });
    check(direct.error !== null, `RLS blocks a direct insert against another reader's edition (${direct.error?.code ?? "no error"})`);

    const reading = a1.edition.stories[a1.edition.stories.length - 1];
    const readingInput = { editionId: a1.edition.id, articleHash: reading.articleHash };
    await recordReading(a.db, a.reader, { ...readingInput, kind: "open" });
    await recordReading(a.db, a.reader, { ...readingInput, kind: "open" });
    const countKind = async (kind: string) =>
      (await getSupabaseAdmin().from("reading_events").select("id", { count: "exact", head: true }).eq("user_id", a.reader.id).eq("kind", kind)).count;
    check((await countKind("open")) === 1, "Read original recorded once per story");
    await recordReading(a.db, a.reader, { ...readingInput, kind: "skip" });
    check((await countKind("skip")) === 1, "skip stored for the reader");
    await undoSkip(a.db, a.reader, readingInput);
    check((await countKind("skip")) === 0, "undo removes the skip");
    const crossSkip = await recordReading(a.db, a.reader, { editionId: bResult.edition.id, articleHash: bResult.edition.stories[0].articleHash, kind: "skip" }).then(
      () => "accepted",
      (e) => (e instanceof FeedbackError ? "rejected" : `error ${e}`),
    );
    check(crossSkip === "rejected", "service rejects a skip on another reader's edition");
    const directSkip = await a.db.from("reading_events").insert({
      user_id: a.reader.id,
      edition_id: bResult.edition.id,
      article_hash: bResult.edition.stories[0].articleHash,
      article_url: bResult.edition.stories[0].url,
      source_id: bResult.edition.stories[0].sourceId,
      topics: ["world"],
      kind: "skip",
    });
    check(directSkip.error !== null, `RLS blocks a direct skip against another reader's edition (${directSkip.error?.code ?? "no error"})`);

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
