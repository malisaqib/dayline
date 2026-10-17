import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleSnapshot } from "@/domain/articles/article";

/** System-only (secret client). Existing hashes are left untouched: snapshots are immutable. */
export async function insertArticleSnapshots(db: SupabaseClient, articles: ArticleSnapshot[]): Promise<void> {
  if (articles.length === 0) {
    return;
  }
  const rows = articles.map((a) => ({
    content_hash: a.contentHash,
    source_id: a.sourceId,
    source_name: a.sourceName,
    title: a.title,
    url: a.url,
    published_at: a.publishedAt,
    fetched_at: a.fetchedAt,
    text: a.text,
    coverage: a.coverage,
    labels: a.labels,
  }));
  const { error } = await db.from("articles").upsert(rows, { onConflict: "content_hash", ignoreDuplicates: true });
  if (error) {
    throw new Error(`insert articles: ${error.message}`);
  }
}
