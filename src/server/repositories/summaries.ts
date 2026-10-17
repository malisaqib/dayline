import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { CachedSummary } from "@/domain/editions/build-edition";

export type SummaryKey = { model: string; promptVersion: string };

/** System-only (secret client). Returns cached briefs keyed by content hash. */
export async function findCachedSummaries(db: SupabaseClient, hashes: string[], key: SummaryKey): Promise<Map<string, CachedSummary>> {
  const result = new Map<string, CachedSummary>();
  if (hashes.length === 0) {
    return result;
  }
  const { data, error } = await db
    .from("article_summaries")
    .select("content_hash, brief, takeaways")
    .in("content_hash", hashes)
    .eq("model", key.model)
    .eq("prompt_version", key.promptVersion);
  if (error) {
    throw new Error(`load summaries: ${error.message}`);
  }
  for (const row of data) {
    const takeaways = z.array(z.string()).safeParse(row.takeaways);
    result.set(row.content_hash, { brief: row.brief, takeaways: takeaways.data ?? [], model: key.model, promptVersion: key.promptVersion });
  }
  return result;
}

export async function insertSummary(
  db: SupabaseClient,
  contentHash: string,
  key: SummaryKey,
  summary: { brief: string; takeaways: string[] },
  usage: { inputTokens: number; outputTokens: number },
): Promise<void> {
  const { error } = await db.from("article_summaries").upsert(
    {
      content_hash: contentHash,
      model: key.model,
      prompt_version: key.promptVersion,
      brief: summary.brief,
      takeaways: summary.takeaways,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
    },
    { onConflict: "content_hash,model,prompt_version", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`insert summary: ${error.message}`);
  }
}
