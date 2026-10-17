import type { ArticleSnapshot } from "@/domain/articles/article";
import { topicLabel, type TopicId } from "@/domain/topics";
import { describeWeight, WEIGHT_POLICY, type TopicWeights } from "./weights";

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

export type ScoredItem = { score: number; matchedTopics: TopicId[]; reasons: string[] };

const HOUR_MS = 3_600_000;

function ageHours(publishedAt: string | null, now: Date): number | null {
  return publishedAt ? Math.max(0, (now.getTime() - Date.parse(publishedAt)) / HOUR_MS) : null;
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

function describeMatch(matchedTopics: TopicId[], weights: TopicWeights): string {
  const parts = matchedTopics.map((topic) => {
    const level = describeWeight(weights[topic] ?? WEIGHT_POLICY.baseline);
    const note = level === "more" ? " (boosted by your feedback)" : level === "less" ? " (reduced by your feedback)" : "";
    return `${topicLabel(topic)}${note}`;
  });
  return `Matches your ${parts.join(" and ")} interest`;
}

/**
 * Score from actual inputs: the strongest matched topic weight (normalised by the
 * maximum weight) and freshness. Reasons are built from the same inputs.
 */
export function scoreItem(item: { topics: TopicId[]; publishedAt: string | null }, weights: TopicWeights, now: Date): ScoredItem {
  const matchedTopics = item.topics.filter((t) => weights[t] !== undefined);
  const strongest = Math.max(0, ...matchedTopics.map((t) => weights[t] ?? 0));
  const hours = ageHours(item.publishedAt, now);
  const score = RANKING_WEIGHTS.topic * (strongest / WEIGHT_POLICY.max) + RANKING_WEIGHTS.freshness * freshnessScore(hours);
  return { score, matchedTopics, reasons: [describeMatch(matchedTopics, weights), describeAge(hours)] };
}

/** Lowercase letters and digits only, so the same story from two feeds collapses to one. */
export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/**
 * Deterministic ranking: only topic-matched, recent articles; highest score first,
 * ties broken by content hash; at most MAX_STORIES_PER_SOURCE per publisher.
 */
export function rankArticles(articles: RankableArticle[], weights: TopicWeights, now: Date, limit: number): RankedArticle[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const candidates = articles
    .filter((a) => {
      const hours = ageHours(a.publishedAt, now);
      return hours !== null && hours <= MAX_AGE_HOURS;
    })
    .map((article) => ({ article, ...scoreItem(article, weights, now) }))
    .filter((r) => r.matchedTopics.length > 0)
    .sort((a, b) => b.score - a.score || a.article.contentHash.localeCompare(b.article.contentHash));

  const perSource = new Map<string, number>();
  const picked: RankedArticle[] = [];
  for (const candidate of candidates) {
    const { sourceId, url } = candidate.article;
    const used = perSource.get(sourceId) ?? 0;
    const title = normalizeTitle(candidate.article.title);
    if (used >= MAX_STORIES_PER_SOURCE || seenUrls.has(url) || seenTitles.has(title)) {
      continue;
    }
    seenTitles.add(title);
    perSource.set(sourceId, used + 1);
    seenUrls.add(url);
    picked.push(candidate);
    if (picked.length === limit) {
      break;
    }
  }
  return picked;
}
