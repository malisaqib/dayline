import type { SupabaseClient } from "@supabase/supabase-js";
import { readingKindSchema, type ReadingEvent } from "@/domain/personalization/behavior";
import { topicIdSchema } from "@/domain/topics";

const MAX_EVENTS = 1000;
const COLUMNS = "edition_id, article_hash, article_url, source_id, topics, kind, created_at";

type Row = { edition_id: string; article_hash: string; article_url: string; source_id: string; topics: unknown; kind: unknown; created_at?: string | null };

function toEvent(row: Row): ReadingEvent | null {
  const topics = topicIdSchema.array().safeParse(row.topics);
  const kind = readingKindSchema.safeParse(row.kind);
  if (!topics.success || !kind.success) {
    return null;
  }
  return { editionId: row.edition_id, articleHash: row.article_hash, articleUrl: row.article_url, sourceId: row.source_id, topics: topics.data, kind: kind.data, at: row.created_at ?? null };
}

export async function insertReadingEvent(db: SupabaseClient, userId: string, event: ReadingEvent): Promise<void> {
  const { error } = await db.from("reading_events").upsert(
    {
      user_id: userId,
      edition_id: event.editionId,
      article_hash: event.articleHash,
      article_url: event.articleUrl,
      source_id: event.sourceId,
      topics: event.topics,
      kind: event.kind,
    },
    { onConflict: "user_id,edition_id,article_hash,kind", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`save reading event: ${error.message}`);
  }
}

export async function deleteSkip(db: SupabaseClient, userId: string, editionId: string, articleHash: string): Promise<void> {
  const { error } = await db
    .from("reading_events")
    .delete()
    .eq("user_id", userId)
    .eq("edition_id", editionId)
    .eq("article_hash", articleHash)
    .eq("kind", "skip");
  if (error) {
    throw new Error(`undo skip: ${error.message}`);
  }
}

export async function listReadingEvents(db: SupabaseClient, userId: string): Promise<ReadingEvent[]> {
  const { data, error } = await db.from("reading_events").select(COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(MAX_EVENTS);
  if (error) {
    throw new Error(`load reading events: ${error.message}`);
  }
  return (data as Row[]).map(toEvent).filter((e): e is ReadingEvent => e !== null);
}

export async function readingForEdition(db: SupabaseClient, editionId: string): Promise<{ skipped: string[]; opened: string[] }> {
  const { data, error } = await db.from("reading_events").select(COLUMNS).eq("edition_id", editionId);
  if (error) {
    throw new Error(`load edition reading events: ${error.message}`);
  }
  const events = (data as Row[]).map(toEvent).filter((e): e is ReadingEvent => e !== null);
  return {
    skipped: events.filter((e) => e.kind === "skip").map((e) => e.articleHash),
    opened: events.filter((e) => e.kind === "open").map((e) => e.articleHash),
  };
}
