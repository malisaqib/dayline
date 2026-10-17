import type { SupabaseClient } from "@supabase/supabase-js";
import { feedbackSignalSchema, type FeedbackSignal, type StoredSignal } from "@/domain/personalization/weights";
import { topicIdSchema } from "@/domain/topics";

/** Bounds the history read used to derive weights; well above a reader's realistic signal count. */
const MAX_SIGNALS = 1000;

/**
 * Reader-scoped upsert. RLS rejects rows for editions the reader does not own;
 * the unique (user_id, edition_id, article_hash) key makes resubmission a no-op.
 */
export async function upsertFeedback(db: SupabaseClient, userId: string, signal: StoredSignal): Promise<void> {
  const { error } = await db.from("feedback_events").upsert(
    {
      user_id: userId,
      edition_id: signal.editionId,
      article_hash: signal.articleHash,
      topics: signal.topics,
      signal: signal.signal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,edition_id,article_hash" },
  );
  if (error) {
    throw new Error(`save feedback: ${error.message}`);
  }
}

type FeedbackRow = { edition_id: string; article_hash: string; topics: unknown; signal: unknown };

function toSignal(row: FeedbackRow): StoredSignal | null {
  const topics = topicIdSchema.array().safeParse(row.topics);
  const signal = feedbackSignalSchema.safeParse(row.signal);
  if (!topics.success || !signal.success) {
    return null;
  }
  return { editionId: row.edition_id, articleHash: row.article_hash, topics: topics.data, signal: signal.data };
}

export async function listSignals(db: SupabaseClient, userId: string): Promise<StoredSignal[]> {
  const { data, error } = await db
    .from("feedback_events")
    .select("edition_id, article_hash, topics, signal")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(MAX_SIGNALS);
  if (error) {
    throw new Error(`load feedback: ${error.message}`);
  }
  return (data as FeedbackRow[]).map(toSignal).filter((s): s is StoredSignal => s !== null);
}

/** Current signal per story for one edition, keyed by article hash. */
export async function signalsForEdition(db: SupabaseClient, editionId: string): Promise<Record<string, FeedbackSignal>> {
  const { data, error } = await db.from("feedback_events").select("edition_id, article_hash, topics, signal").eq("edition_id", editionId);
  if (error) {
    throw new Error(`load edition feedback: ${error.message}`);
  }
  const result: Record<string, FeedbackSignal> = {};
  for (const signal of (data as FeedbackRow[]).map(toSignal)) {
    if (signal) {
      result[signal.articleHash] = signal.signal;
    }
  }
  return result;
}
