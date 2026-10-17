import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { buildEditionStories, canSummarize, chooseStoryBody, type CachedSummary, type StoryBody } from "@/domain/editions/build-edition";
import { EDITION_TIMEZONE, MAX_EDITION_STORIES, localEditionDate, type Edition } from "@/domain/editions/edition";
import { rankArticles } from "@/domain/personalization/rank";
import { isSummarizerConfigured, summarizeArticle, summaryModelId, SUMMARY_PROMPT_VERSION, SummaryUnavailableError } from "@/server/ai/summarize";
import type { Reader } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { insertArticleSnapshots } from "@/server/repositories/articles";
import { findEditionByDate, insertEditionIfAbsent } from "@/server/repositories/editions";
import { findProfile } from "@/server/repositories/profiles";
import { findCachedSummaries, insertSummary, type SummaryKey } from "@/server/repositories/summaries";
import { usageFor } from "@/server/sources/catalog";
import { fetchArticlePool } from "@/server/sources/pool";

const SUMMARY_CONCURRENCY = 3;

export class GenerationError extends Error {
  constructor(
    readonly code: "no_profile" | "no_articles" | "no_matches",
    message: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export type GenerationStats = {
  reused: boolean;
  durationMs: number;
  poolSize: number;
  failedSources: string[];
  summaryCacheHits: number;
  modelCalls: number;
  modelFailures: number;
};

export type GenerationResult = { edition: Edition; stats: GenerationStats };

async function mapWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function resolveSummaries(admin: SupabaseClient, articles: ArticleSnapshot[], stats: GenerationStats): Promise<Map<string, CachedSummary>> {
  if (articles.length === 0 || !isSummarizerConfigured()) {
    return new Map();
  }
  const key: SummaryKey = { model: summaryModelId(), promptVersion: SUMMARY_PROMPT_VERSION };
  const summaries = await findCachedSummaries(admin, articles.map((a) => a.contentHash), key);
  stats.summaryCacheHits = summaries.size;

  const missing = articles.filter((a) => !summaries.has(a.contentHash));
  await mapWithConcurrency(missing, SUMMARY_CONCURRENCY, async (article) => {
    stats.modelCalls += 1;
    try {
      const result = await summarizeArticle(article);
      await insertSummary(admin, article.contentHash, key, { brief: result.summary, takeaways: result.takeaways }, result);
      summaries.set(article.contentHash, { brief: result.summary, takeaways: result.takeaways, ...key });
    } catch (error) {
      if (!(error instanceof SummaryUnavailableError)) {
        throw error;
      }
      // Fall back to the publisher excerpt for this story; the edition still generates.
      stats.modelFailures += 1;
      console.warn(`[generate] ${error.message} (article ${article.contentHash.slice(0, 12)})`);
    }
  });
  return summaries;
}

/**
 * Returns the reader's edition for today (Asia/Karachi), generating it once if absent.
 * Reads go through the reader's RLS-scoped client; shared writes use the secret client
 * only after the reader has been verified by the caller.
 */
export async function getOrCreateDailyEdition(readerDb: SupabaseClient, reader: Reader, now = new Date()): Promise<GenerationResult> {
  const started = Date.now();
  const localDate = localEditionDate(now);
  const stats: GenerationStats = { reused: true, durationMs: 0, poolSize: 0, failedSources: [], summaryCacheHits: 0, modelCalls: 0, modelFailures: 0 };

  const existing = await findEditionByDate(readerDb, reader.id, localDate);
  if (existing) {
    return { edition: existing, stats: { ...stats, durationMs: Date.now() - started } };
  }

  const profile = await findProfile(readerDb, reader.id);
  if (!profile) {
    throw new GenerationError("no_profile", "Choose your topics before generating a paper.");
  }

  const pool = await fetchArticlePool();
  stats.reused = false;
  stats.poolSize = pool.articles.length;
  stats.failedSources = pool.failedSources.map((f) => f.sourceId);
  if (pool.articles.length === 0) {
    throw new GenerationError("no_articles", "No news sources could be reached. Try again in a few minutes.");
  }

  const ranked = rankArticles(pool.articles, profile.weights, now, MAX_EDITION_STORIES);
  if (ranked.length === 0) {
    throw new GenerationError("no_matches", "No recent stories match your topics yet. Try adding another topic.");
  }

  const admin = getSupabaseAdmin();
  const chosen = ranked.map((r) => r.article);
  await insertArticleSnapshots(admin, chosen);

  const summarizable = chosen.filter((a) => canSummarize(a, usageFor(a.sourceId)));
  const summaries = await resolveSummaries(admin, summarizable, stats);

  const bodies = new Map<string, StoryBody>(
    chosen.map((a) => [a.contentHash, chooseStoryBody(a, usageFor(a.sourceId), summaries.get(a.contentHash) ?? null)]),
  );

  await insertEditionIfAbsent(admin, {
    userId: reader.id,
    localDate,
    timezone: EDITION_TIMEZONE,
    sourcesFetchedAt: pool.fetchedAt,
    profile: { topics: profile.topics, weights: profile.weights },
    stories: buildEditionStories(ranked, bodies),
  });

  // Re-read through the reader's client: if a concurrent request won the insert, this returns its edition.
  const edition = await findEditionByDate(readerDb, reader.id, localDate);
  if (!edition) {
    throw new Error("edition insert succeeded but the edition is not readable by its owner");
  }
  stats.durationMs = Date.now() - started;
  console.info(`[generate] edition ${edition.id} ${JSON.stringify(stats)}`);
  return { edition, stats };
}
