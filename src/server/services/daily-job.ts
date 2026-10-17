import type { SupabaseClient } from "@supabase/supabase-js";
import { localEditionDate } from "@/domain/editions/edition";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { listProfileUserIds } from "@/server/repositories/profiles";
import { fetchArticlePool, type ArticlePool } from "@/server/sources/pool";
import { GenerationError, getOrCreateDailyEdition, type GenerationOptions, type GenerationResult } from "./generate-edition";

export const JOB_PAGE_SIZE = 100;
export const JOB_CONCURRENCY = 3;

/** Compact operational result: counts only, never reader ids or profile data. */
export type DailyJobResult = {
  localDate: string;
  examined: number;
  created: number;
  reused: number;
  failed: number;
  durationMs: number;
};

export type DailyJobDeps = {
  listUserIds: (afterUserId: string | null, limit: number) => Promise<string[]>;
  generate: (userId: string, options: GenerationOptions) => Promise<GenerationResult>;
  loadPool: () => Promise<ArticlePool>;
};

function productionDeps(admin: SupabaseClient): DailyJobDeps {
  return {
    listUserIds: (after, limit) => listProfileUserIds(admin, after, limit),
    // Ids come from our own profiles table, never from the caller; every read is filtered by that id.
    generate: (userId, options) => getOrCreateDailyEdition(admin, { id: userId, isAnonymous: true }, options),
    loadPool: fetchArticlePool,
  };
}

/** Runs once and shares the promise, so all readers in a run use one fetched pool. */
function memoise<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => (pending ??= load());
}

/**
 * Ensures every reader with a profile has today's edition. Existing editions are
 * reused (the DB unique key also guards concurrent runs); one reader's failure is
 * counted and logged without stopping the rest.
 */
export async function runDailyEditionJob(now = new Date(), deps: DailyJobDeps = productionDeps(getSupabaseAdmin())): Promise<DailyJobResult> {
  const started = Date.now();
  const loadPool = memoise(deps.loadPool);
  const result: DailyJobResult = { localDate: localEditionDate(now), examined: 0, created: 0, reused: 0, failed: 0, durationMs: 0 };

  async function processReader(userId: string): Promise<void> {
    result.examined += 1;
    try {
      const { stats } = await deps.generate(userId, { now, loadPool });
      if (stats.reused) {
        result.reused += 1;
      } else {
        result.created += 1;
      }
    } catch (error) {
      result.failed += 1;
      const reason = error instanceof GenerationError ? error.code : error instanceof Error ? error.message.slice(0, 160) : "unknown";
      // Short id prefix only, for correlating with the database; no profile data.
      console.error(`[daily-job] reader ${userId.slice(0, 8)} failed: ${reason}`);
    }
  }

  let after: string | null = null;
  for (;;) {
    const page = await deps.listUserIds(after, JOB_PAGE_SIZE);
    if (page.length === 0) {
      break;
    }
    const queue = [...page];
    await Promise.all(
      Array.from({ length: Math.min(JOB_CONCURRENCY, queue.length) }, async () => {
        for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
          await processReader(id);
        }
      }),
    );
    after = page[page.length - 1];
    if (page.length < JOB_PAGE_SIZE) {
      break;
    }
  }

  result.durationMs = Date.now() - started;
  console.info(`[daily-job] ${JSON.stringify(result)}`);
  return result;
}
