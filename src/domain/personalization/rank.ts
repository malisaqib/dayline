import type { ArticleSnapshot } from "@/domain/articles/article";
import { topicLabel, type TopicId } from "@/domain/topics";

/** Tuning defaults from the plan, not a validated recommender. */
export const RANKING_WEIGHTS = { topic: 0.75, freshness: 0.25 } as const;
export const FRESHNESS_HALF_LIFE_HOURS = 24;
export const MAX_AGE_HOURS = 96;
export const MAX_STORIES_PER_SOURCE = 2;

export type RankableArticle = ArticleSnapshot & { topics: TopicId[] };

export type RankedArticle = {
  article: RankableArticle;
  score: number;
  matchedTopics: TopicId[];
  reasons: string[];
};

const HOUR_MS = 3_600_000;

function ageHours(article: ArticleSnapshot, now: Date): number | null {
  return article.publishedAt ? Math.max(0, (now.getTime() - Date.parse(article.publishedAt)) / HOUR_MS) : null;
}

function freshnessScore(hours: number | null): number {
  return hours === null ? 0 : Math.pow(0.5, hours / FRESHNESS_HALF_LIFE_HOURS);
}

function describeAge(hours: number | null): string {
  if (hours === null) {
    return "publication time unknown";
  }
  if (hours < 1) {
    return "published within the hour";
  }
  return hours < 24 ? `published ${Math.round(hours)}h ago` : `published ${Math.round(hours / 24)}d ago`;
}

function scoreArticle(article: RankableArticle, topics: TopicId[], now: Date): RankedArticle {
  const matchedTopics = article.topics.filter((t) => topics.includes(t));
  const hours = ageHours(article, now);
  const score = RANKING_WEIGHTS.topic * (matchedTopics.length > 0 ? 1 : 0) + RANKING_WEIGHTS.freshness * freshnessScore(hours);
  const matchReason = `Matches your ${matchedTopics.map(topicLabel).join(" and ")} interest`;
  return { article, score, matchedTopics, reasons: [matchReason, describeAge(hours)] };
}

/**
 * Deterministic ranking: only topic-matched, recent articles; highest score first,
 * ties broken by content hash; at most MAX_STORIES_PER_SOURCE per publisher.
 */
export function rankArticles(articles: RankableArticle[], topics: TopicId[], now: Date, limit: number): RankedArticle[] {
  const seenUrls = new Set<string>();
  const candidates = articles
    .filter((a) => {
      const hours = ageHours(a, now);
      return hours !== null && hours <= MAX_AGE_HOURS;
    })
    .map((a) => scoreArticle(a, topics, now))
    .filter((r) => r.matchedTopics.length > 0)
    .sort((a, b) => b.score - a.score || a.article.contentHash.localeCompare(b.article.contentHash));

  const perSource = new Map<string, number>();
  const picked: RankedArticle[] = [];
  for (const candidate of candidates) {
    const { sourceId, url } = candidate.article;
    const used = perSource.get(sourceId) ?? 0;
    if (used >= MAX_STORIES_PER_SOURCE || seenUrls.has(url)) {
      continue;
    }
    perSource.set(sourceId, used + 1);
    seenUrls.add(url);
    picked.push(candidate);
    if (picked.length === limit) {
      break;
    }
  }
  return picked;
}
