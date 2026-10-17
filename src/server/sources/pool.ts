import type { RankableArticle } from "@/domain/personalization/rank";
import { ENABLED_SOURCES, type FeedSource, type SourceKind } from "./catalog";
import { fetchKev } from "./cisa-kev";
import { fetchGdacs } from "./gdacs";
import { fetchHackerNews } from "./hacker-news";
import { fetchFeed } from "./rss";
import type { SourceFetchResult } from "./snapshot";

export type ArticlePool = {
  articles: RankableArticle[];
  fetchedAt: string;
  failedSources: { sourceId: string; reason: string }[];
};

const ADAPTERS: Record<SourceKind, (source: FeedSource) => Promise<SourceFetchResult>> = {
  rss: fetchFeed,
  cisa_kev: fetchKev,
  hacker_news: fetchHackerNews,
  gdacs: fetchGdacs,
};

export function fetchSource(source: FeedSource): Promise<SourceFetchResult> {
  return ADAPTERS[source.kind](source);
}

/** Fetches every given source once, in parallel. One failing source does not fail the pool. */
export async function fetchArticlePool(
  sources: FeedSource[] = ENABLED_SOURCES,
  fetcher: (source: FeedSource) => Promise<SourceFetchResult> = fetchSource,
): Promise<ArticlePool> {
  const results = await Promise.allSettled(sources.map(fetcher));
  const articles: RankableArticle[] = [];
  const failedSources: ArticlePool["failedSources"] = [];

  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === "rejected") {
      failedSources.push({ sourceId: source.id, reason: result.reason instanceof Error ? result.reason.message : String(result.reason) });
      return;
    }
    articles.push(...result.value.articles.map((a) => ({ ...a, topics: source.topics })));
  });

  return { articles, fetchedAt: new Date().toISOString(), failedSources };
}
