import { z } from "zod";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { MAX_AGE_HOURS } from "@/domain/personalization/rank";
import type { FeedSource } from "./catalog";
import { buildSnapshot, fetchWithTimeout, type SourceFetchResult } from "./snapshot";

const ITEM_URL = (id: number) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
export const HN_TOP_IDS = 20;
export const HN_MAX_STORIES = 8;
const HN_POINTS_FOR_MAX = 500;
const HN_COMMENTS_FOR_MAX = 300;
const HN_IMPORTANCE_CEILING = 0.35;
const ITEM_CONCURRENCY = 5;
const LIST_TIMEOUT_MS = 8_000;
const ITEM_TIMEOUT_MS = 6_000;

const itemSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  time: z.number(),
  score: z.number().optional(),
  descendants: z.number().optional(),
  deleted: z.boolean().optional(),
  dead: z.boolean().optional(),
});

export type HackerNewsStory = { id: number; title: string; url: string; time: number; score: number; comments: number };

/** HN-style rank: points decayed by age, so a fresh story can beat an older high scorer. */
function hnRank(story: HackerNewsStory, now: Date): number {
  const hours = Math.max(0, (now.getTime() / 1000 - story.time) / 3600);
  return story.score / Math.pow(hours + 2, 1.5);
}

/**
 * Pure: keeps live stories with a title and external http(s) URL inside the age
 * limit (no jobs, deleted, dead or text-only posts), best `limit` by points and age.
 */
export function selectHackerNewsStories(items: unknown[], now: Date, limit = HN_MAX_STORIES): HackerNewsStory[] {
  const cutoff = now.getTime() / 1000 - MAX_AGE_HOURS * 3600;
  const stories: HackerNewsStory[] = [];
  for (const raw of items) {
    const item = itemSchema.safeParse(raw);
    if (!item.success) {
      continue;
    }
    const { id, type, title, url, time, score, descendants, deleted, dead } = item.data;
    if (type !== "story" || deleted || dead || !title?.trim() || !url || !/^https?:\/\//.test(url) || time < cutoff) {
      continue;
    }
    stories.push({ id, title: title.trim(), url, time, score: score ?? 0, comments: descendants ?? 0 });
  }
  return stories.sort((a, b) => hnRank(b, now) - hnRank(a, now) || a.id - b.id).slice(0, limit);
}

function toSnapshot(source: FeedSource, story: HackerNewsStory, fetchedAt: string): ArticleSnapshot | null {
  return buildSnapshot(
    source,
    {
      title: story.title,
      url: story.url,
      publishedAt: new Date(story.time * 1000).toISOString(),
      text: "",
      fromFullContentField: false,
      labels: ["Hacker News front page", `${story.score} points`, `${story.comments} comments`],
      importance: HN_IMPORTANCE_CEILING * Math.min(1, Math.max(story.score / HN_POINTS_FOR_MAX, story.comments / HN_COMMENTS_FOR_MAX)),
    },
    fetchedAt,
  );
}

async function fetchJson(source: FeedSource, url: string, timeoutMs: number): Promise<unknown> {
  const response = await fetchWithTimeout(source, url, timeoutMs);
  return response.json();
}

export async function fetchHackerNews(source: FeedSource): Promise<SourceFetchResult> {
  const ids = z.array(z.number()).safeParse(await fetchJson(source, source.url, LIST_TIMEOUT_MS));
  if (!ids.success) {
    throw new Error(`${source.id}: top stories response is not a list of ids`);
  }

  const queue = ids.data.slice(0, HN_TOP_IDS);
  const items: unknown[] = [];
  // Bounded concurrency; a failed item is skipped rather than failing the source.
  await Promise.all(
    Array.from({ length: ITEM_CONCURRENCY }, async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
        items.push(await fetchJson(source, ITEM_URL(id), ITEM_TIMEOUT_MS).catch(() => null));
      }
    }),
  );

  const now = new Date();
  const selected = selectHackerNewsStories(items, now);
  const articles = selected.map((s) => toSnapshot(source, s, now.toISOString())).filter((a): a is ArticleSnapshot => a !== null);
  return { source, articles, rejected: Math.min(HN_TOP_IDS, ids.data.length) - articles.length };
}
