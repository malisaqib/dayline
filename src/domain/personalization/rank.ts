import type { ArticleSnapshot } from "@/domain/articles/article";
import { areSameStory, titleTokens } from "@/domain/articles/similarity";
import { interestReason, matchInterests } from "@/domain/interests";
import { topicLabel, type TopicId } from "@/domain/topics";
import { BEHAVIOR_POLICY, EMPTY_PERSONAL_SIGNALS, type PersonalSignals } from "./behavior";
import { describeWeight, WEIGHT_POLICY, type TopicWeights } from "./weights";

export const RANKING_WEIGHTS = { topic: 0.6, freshness: 0.2, importance: 0.2 } as const;
export const FRESHNESS_HALF_LIFE_HOURS = 24;
export const MAX_AGE_HOURS = 96;
export const MAX_STORIES_PER_SOURCE = 2;
export const MAX_STORIES_PER_SOURCE_RELAXED = 3;
export const INTEREST_BOOST = 0.15;
export const THIN_TEXT_PENALTY = 0.05;
const THIN_TEXT_CHARS = 40;
const SOURCES_FOR_FULL_COVERAGE_SCORE = 3;

export type RankableArticle = ArticleSnapshot & { topics: TopicId[] };

export type RankedArticle = {
  article: RankableArticle;
  score: number;
  matchedTopics: TopicId[];
  matchedInterests: string[];
  reasons: string[];
  sourceCount: number;
  importance: number;
};

export type ScoredItem = { score: number; matchedTopics: TopicId[]; reasons: string[] };

export type ScoreInput = {
  topics: TopicId[];
  publishedAt: string | null;
  importance?: number;
  sourceCount?: number;
  sourceId?: string;
  sourceName?: string;
  url?: string;
  articleHash?: string;
  matchedInterests?: string[];
};

const AFFINITY_REASON_THRESHOLD = 0.04;

const HOUR_MS = 3_600_000;
const RELAXED_REASON = "Included to fill your paper: few other sources covered your topics today";

function ageHours(publishedAt: string | null, now: Date): number | null {
  if (!publishedAt) {
    return null;
  }
  return Math.max(0, (now.getTime() - Date.parse(publishedAt)) / HOUR_MS);
}

function freshnessScore(hours: number | null): number {
  if (hours === null) {
    return 0;
  }
  return Math.pow(0.5, hours / FRESHNESS_HALF_LIFE_HOURS);
}

function describeAge(hours: number | null): string {
  if (hours === null) {
    return "publication time unknown";
  }
  if (hours < 1) {
    return "published within the hour";
  }
  if (hours < 24) {
    return `published ${Math.round(hours)}h ago`;
  }
  return `published ${Math.round(hours / 24)}d ago`;
}

function feedbackNote(weight: number): string {
  const level = describeWeight(weight);
  if (level === "more") {
    return " (boosted by your feedback)";
  }
  if (level === "less") {
    return " (reduced by your feedback)";
  }
  return "";
}

function describeMatch(matchedTopics: TopicId[], weights: TopicWeights): string {
  const parts = matchedTopics.map((topic) => `${topicLabel(topic)}${feedbackNote(weights[topic] ?? WEIGHT_POLICY.baseline)}`);
  return `Matches your ${parts.join(" and ")} interest`;
}

export function coverageImportance(sourceCount: number): number {
  return Math.min(1, Math.max(0, sourceCount - 1) / (SOURCES_FOR_FULL_COVERAGE_SCORE - 1));
}

function personalAdjustment(item: ScoreInput, personal: PersonalSignals): { delta: number; reasons: string[] } {
  const reasons: string[] = [];
  const affinity = item.sourceId ? (personal.sourceAffinity[item.sourceId] ?? 0) : 0;
  if (affinity >= AFFINITY_REASON_THRESHOLD && item.sourceName) {
    reasons.push(`You often read ${item.sourceName}`);
  }
  const skipped = [item.articleHash, item.url].some((key) => key !== undefined && personal.skipped.has(key));
  const penalty = skipped ? BEHAVIOR_POLICY.skippedPenalty : 0;
  if (skipped) {
    reasons.push("You skipped this story before; shown only because few alternatives were available");
  }
  return { delta: affinity - penalty, reasons };
}

export function calibratedImportance(native: number, sourceCount: number): number {
  return Math.max(native, coverageImportance(sourceCount));
}

function thinTextPenalty(article: RankableArticle): number {
  if (article.text.trim().length < THIN_TEXT_CHARS) {
    return THIN_TEXT_PENALTY;
  }
  return 0;
}

function topicStrength(matchedTopics: TopicId[], weights: TopicWeights, interestOnly: boolean): number {
  if (matchedTopics.length === 0 && interestOnly) {
    return WEIGHT_POLICY.baseline;
  }
  return Math.max(0, ...matchedTopics.map((t) => weights[t] ?? 0));
}

function interestBoost(interests: string[]): number {
  if (interests.length === 0) {
    return 0;
  }
  return INTEREST_BOOST;
}

function matchReasons(matchedTopics: TopicId[], weights: TopicWeights, interests: string[]): string[] {
  const reasons = interests.map(interestReason);
  if (matchedTopics.length > 0) {
    reasons.push(describeMatch(matchedTopics, weights));
  }
  return reasons;
}

export function scoreItem(item: ScoreInput, weights: TopicWeights, now: Date, personal: PersonalSignals = EMPTY_PERSONAL_SIGNALS): ScoredItem {
  const matchedTopics = item.topics.filter((t) => weights[t] !== undefined);
  const interests = item.matchedInterests ?? [];
  const strongest = topicStrength(matchedTopics, weights, interests.length > 0);
  const hours = ageHours(item.publishedAt, now);
  const sourceCount = item.sourceCount ?? 1;
  const importance = calibratedImportance(item.importance ?? 0, sourceCount);
  const adjustment = personalAdjustment(item, personal);
  const score =
    RANKING_WEIGHTS.topic * (strongest / WEIGHT_POLICY.max) +
    RANKING_WEIGHTS.freshness * freshnessScore(hours) +
    RANKING_WEIGHTS.importance * importance +
    interestBoost(interests) +
    adjustment.delta;
  const reasons = [...matchReasons(matchedTopics, weights, interests), describeAge(hours)];
  if (sourceCount > 1) {
    reasons.push(`Covered by ${sourceCount} sources`);
  }
  return { score, matchedTopics, reasons: [...reasons, ...adjustment.reasons] };
}

export function normalizeTitle(title: string): string {
  return [...titleTokens(title)].join(" ");
}

type Cluster = { members: RankableArticle[]; tokens: Set<string>[]; sources: Set<string> };

export function clusterArticles(articles: RankableArticle[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const article of articles) {
    const tokens = titleTokens(article.title);
    const home = clusters.find((cluster) => cluster.members.some((m) => m.url === article.url) || cluster.tokens.some((t) => areSameStory(t, tokens)));
    if (home) {
      home.members.push(article);
      home.tokens.push(tokens);
      home.sources.add(article.sourceId);
      continue;
    }
    clusters.push({ members: [article], tokens: [tokens], sources: new Set([article.sourceId]) });
  }
  return clusters;
}

function isFresh(article: RankableArticle, now: Date): boolean {
  const hours = ageHours(article.publishedAt, now);
  return hours !== null && hours <= MAX_AGE_HOURS;
}

function bestOfCluster(cluster: Cluster, weights: TopicWeights, now: Date, personal: PersonalSignals, interests: string[]): RankedArticle | null {
  const sourceCount = cluster.sources.size;
  const ranked = cluster.members
    .map((article) => {
      const matchedInterests = matchInterests(`${article.title} ${article.text}`, interests);
      const scored = scoreItem({ ...article, sourceCount, articleHash: article.contentHash, matchedInterests }, weights, now, personal);
      const importance = calibratedImportance(article.importance ?? 0, sourceCount);
      return { article, ...scored, score: scored.score - thinTextPenalty(article), matchedInterests, sourceCount, importance };
    })
    .filter((r) => r.matchedTopics.length > 0 || r.matchedInterests.length > 0)
    .sort((a, b) => b.score - a.score || a.article.contentHash.localeCompare(b.article.contentHash));
  return ranked[0] ?? null;
}

function pickWithCap(candidates: RankedArticle[], picked: RankedArticle[], cap: number, limit: number, relaxed: boolean): void {
  const perSource = new Map<string, number>();
  for (const p of picked) {
    perSource.set(p.article.sourceId, (perSource.get(p.article.sourceId) ?? 0) + 1);
  }
  for (const candidate of candidates) {
    if (picked.length >= limit) {
      return;
    }
    const used = perSource.get(candidate.article.sourceId) ?? 0;
    if (used >= cap || picked.includes(candidate)) {
      continue;
    }
    perSource.set(candidate.article.sourceId, used + 1);
    if (relaxed) {
      candidate.reasons = [...candidate.reasons, RELAXED_REASON];
    }
    picked.push(candidate);
  }
}

function seedEachTopic(candidates: RankedArticle[], picked: RankedArticle[], weights: TopicWeights, limit: number): void {
  const topics = (Object.keys(weights) as TopicId[]).sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0) || a.localeCompare(b));
  for (const topic of topics) {
    if (picked.length >= limit || picked.some((p) => p.matchedTopics.includes(topic))) {
      continue;
    }
    const usedBySource = (sourceId: string) => picked.filter((p) => p.article.sourceId === sourceId).length;
    const best = candidates.find((c) => c.matchedTopics.includes(topic) && !picked.includes(c) && usedBySource(c.article.sourceId) < MAX_STORIES_PER_SOURCE);
    if (best) {
      picked.push(best);
    }
  }
}

function seedEachInterest(candidates: RankedArticle[], picked: RankedArticle[], interests: string[], limit: number): void {
  for (const interest of interests) {
    if (picked.length >= limit || picked.some((p) => p.matchedInterests.includes(interest))) {
      continue;
    }
    const usedBySource = (sourceId: string) => picked.filter((p) => p.article.sourceId === sourceId).length;
    const best = candidates.find((c) => c.matchedInterests.includes(interest) && !picked.includes(c) && usedBySource(c.article.sourceId) < MAX_STORIES_PER_SOURCE);
    if (best) {
      picked.push(best);
    }
  }
}

export function rankArticles(
  articles: RankableArticle[],
  weights: TopicWeights,
  now: Date,
  limit: number,
  personal: PersonalSignals = EMPTY_PERSONAL_SIGNALS,
  interests: string[] = [],
): RankedArticle[] {
  const clusters = clusterArticles(articles.filter((a) => isFresh(a, now)));
  const candidates = clusters
    .map((cluster) => bestOfCluster(cluster, weights, now, personal, interests))
    .filter((r): r is RankedArticle => r !== null)
    .sort((a, b) => b.score - a.score || a.article.contentHash.localeCompare(b.article.contentHash));

  const picked: RankedArticle[] = [];
  seedEachInterest(candidates, picked, interests, limit);
  seedEachTopic(candidates, picked, weights, limit);
  pickWithCap(candidates, picked, MAX_STORIES_PER_SOURCE, limit, false);
  if (picked.length < limit) {
    pickWithCap(candidates, picked, MAX_STORIES_PER_SOURCE_RELAXED, limit, true);
  }
  return picked.sort((a, b) => b.score - a.score || a.article.contentHash.localeCompare(b.article.contentHash));
}
