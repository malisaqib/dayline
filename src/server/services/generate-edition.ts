import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { buildEditionStories, chooseStoryBody, summaryMode, type CachedSummary, type StoryBody, type SummaryMode } from "@/domain/editions/build-edition";
import { EDITION_TIMEZONE, MAX_EDITION_STORIES, localEditionDate, type Edition, type StorySnapshot } from "@/domain/editions/edition";
import type { Highlight } from "@/domain/editions/today-in-three";
import { rankArticles } from "@/domain/personalization/rank";
import {
  EXCERPT_PROMPT_VERSION,
  isSummarizerConfigured,
  summarizeArticle,
  summarizeExcerpt,
  summaryModelId,
  SUMMARY_PROMPT_VERSION,
  SummaryUnavailableError,
  type SummaryResult,
} from "@/server/ai/summarize";
import { buildTodayInThree, TodayInThreeUnavailableError } from "@/server/ai/today-in-three";
import type { Reader } from "@/server/auth/session";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { insertArticleSnapshots } from "@/server/repositories/articles";
import { findEditionByDate, insertEditionIfAbsent } from "@/server/repositories/editions";
import { findProfile } from "@/server/repositories/profiles";
import { findCachedSummaries, insertSummary, type SummaryKey } from "@/server/repositories/summaries";
import { usageFor } from "@/server/sources/catalog";
import { fetchArticlePool, type ArticlePool } from "@/server/sources/pool";

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
  todayInThree: number;
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

type SummaryJob = { article: ArticleSnapshot; mode: SummaryMode };

const SUMMARIZERS: Record<SummaryMode, { promptVersion: string; run: (article: ArticleSnapshot) => Promise<SummaryResult> }> = {
  full: { promptVersion: SUMMARY_PROMPT_VERSION, run: (article) => summarizeArticle(article) },
  excerpt: { promptVersion: EXCERPT_PROMPT_VERSION, run: (article) => summarizeExcerpt(article) },
};

async function resolveSummaries(admin: SupabaseClient, jobs: SummaryJob[], stats: GenerationStats): Promise<Map<string, CachedSummary>> {
  const summaries = new Map<string, CachedSummary>();
  if (jobs.length === 0 || !isSummarizerConfigured()) {
    return summaries;
  }
  for (const mode of Object.keys(SUMMARIZERS) as SummaryMode[]) {
    const articles = jobs.filter((job) => job.mode === mode).map((job) => job.article);
    if (articles.length === 0) {
      continue;
    }
    const { promptVersion, run } = SUMMARIZERS[mode];
    const key: SummaryKey = { model: summaryModelId(), promptVersion };
    const cached = await findCachedSummaries(admin, articles.map((a) => a.contentHash), key);
    cached.forEach((value, hash) => summaries.set(hash, value));
    stats.summaryCacheHits += cached.size;

    const missing = articles.filter((a) => !cached.has(a.contentHash));
    await mapWithConcurrency(missing, SUMMARY_CONCURRENCY, async (article) => {
      stats.modelCalls += 1;
      try {
        const result = await run(article);
        await insertSummary(admin, article.contentHash, key, { brief: result.summary, takeaways: result.takeaways }, result);
        summaries.set(article.contentHash, { brief: result.summary, takeaways: result.takeaways, ...key });
      } catch (error) {
        if (!(error instanceof SummaryUnavailableError)) {
          throw error;
        }
        stats.modelFailures += 1;
        console.warn(`[generate] ${error.message} (article ${article.contentHash.slice(0, 12)})`);
      }
    });
  }
  return summaries;
}

async function resolveTodayInThree(stories: StorySnapshot[], stats: GenerationStats): Promise<Highlight[]> {
  if (!isSummarizerConfigured()) {
    return [];
  }
  stats.modelCalls += 1;
  try {
    const items = await buildTodayInThree(stories);
    stats.todayInThree = items.length;
    return items;
  } catch (error) {
    if (!(error instanceof TodayInThreeUnavailableError)) {
      throw error;
    }
    stats.modelFailures += 1;
    console.warn(`[generate] ${error.message}`);
    return [];
  }
}

export type GenerationOptions = {
  now?: Date;
  /** Supplies the article pool; the daily job passes a shared, memoised loader so feeds are fetched once per run. */
  loadPool?: () => Promise<ArticlePool>;
};

/**
 * Returns the reader's edition for today (Asia/Karachi), generating it once if absent.
 * Every read is filtered by `reader.id`. Reader requests pass the reader's RLS-scoped
 * client; only the server-side daily job passes the secret client, with ids it loaded
 * itself. Shared writes always use the secret client.
 */
export async function getOrCreateDailyEdition(
  readerDb: SupabaseClient,
  reader: Reader,
  { now = new Date(), loadPool = fetchArticlePool }: GenerationOptions = {},
): Promise<GenerationResult> {
  const started = Date.now();
  const localDate = localEditionDate(now);
  const stats: GenerationStats = { reused: true, durationMs: 0, poolSize: 0, failedSources: [], summaryCacheHits: 0, modelCalls: 0, modelFailures: 0, todayInThree: 0 };

  const existing = await findEditionByDate(readerDb, reader.id, localDate);
  if (existing) {
    return { edition: existing, stats: { ...stats, durationMs: Date.now() - started } };
  }

  const profile = await findProfile(readerDb, reader.id);
  if (!profile) {
    throw new GenerationError("no_profile", "Choose your topics before generating a paper.");
  }

  const pool = await loadPool();
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

  const jobs = chosen.flatMap((article) => {
    const mode = summaryMode(article, usageFor(article.sourceId));
    if (!mode) {
      return [];
    }
    return [{ article, mode }];
  });
  const summaries = await resolveSummaries(admin, jobs, stats);

  const bodies = new Map<string, StoryBody>(
    chosen.map((a) => [a.contentHash, chooseStoryBody(a, usageFor(a.sourceId), summaries.get(a.contentHash) ?? null)]),
  );

  const stories = buildEditionStories(ranked, bodies);
  await insertEditionIfAbsent(admin, {
    userId: reader.id,
    localDate,
    timezone: EDITION_TIMEZONE,
    sourcesFetchedAt: pool.fetchedAt,
    profile: { topics: profile.topics, weights: profile.weights },
    stories,
    todayInThree: await resolveTodayInThree(stories, stats),
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
