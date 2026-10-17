import type { RankableArticle } from "@/domain/personalization/rank";
import { ENABLED_SOURCES } from "./catalog";
import { fetchFeed } from "./rss";

export type ArticlePool = {
  articles: RankableArticle[];
  fetchedAt: string;
  failedSources: { sourceId: string; reason: string }[];
};

/** Fetches every enabled source once, in parallel. One failing feed does not fail the pool. */
export async function fetchArticlePool(): Promise<ArticlePool> {
  const results = await Promise.allSettled(ENABLED_SOURCES.map(fetchFeed));
  const articles: RankableArticle[] = [];
  const failedSources: ArticlePool["failedSources"] = [];

  results.forEach((result, index) => {
    const source = ENABLED_SOURCES[index];
    if (result.status === "rejected") {
      failedSources.push({ sourceId: source.id, reason: (result.reason as Error).message });
      return;
    }
    articles.push(...result.value.articles.map((a) => ({ ...a, topics: source.topics })));
  });

  return { articles, fetchedAt: new Date().toISOString(), failedSources };
}
