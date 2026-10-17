import { createHash } from "node:crypto";
import { articleSnapshotSchema, classifyCoverage, type ArticleSnapshot } from "@/domain/articles/article";
import type { FeedSource } from "./catalog";

export const MAX_TEXT_CHARS = 6000;
const TRACKING_PARAM = /^(utm_|at_|fbclid$|gclid$|ref$)/i;

/** Canonical form for de-duplication: tracking parameters and fragments removed. */
export function canonicalUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export type SnapshotInput = {
  title: string;
  url: string;
  publishedAt: string | null;
  text: string;
  fromFullContentField: boolean;
  labels?: string[];
  importance?: number;
};

/** Validated, hashed, immutable snapshot of one item as fetched now. Returns null if invalid. */
export function buildSnapshot(source: FeedSource, input: SnapshotInput, fetchedAt: string): ArticleSnapshot | null {
  const url = canonicalUrl(input.url);
  if (!url) {
    return null;
  }
  const text = input.text.slice(0, MAX_TEXT_CHARS);
  const labels = input.labels ?? [];
  const parsed = articleSnapshotSchema.safeParse({
    sourceId: source.id,
    sourceName: source.name,
    title: input.title,
    url,
    publishedAt: input.publishedAt,
    fetchedAt,
    text,
    coverage: classifyCoverage(text, input.fromFullContentField),
    labels,
    importance: input.importance,
    // Labels join the hash only when present, so plain feed items keep their earlier hashes (and cached summaries).
    contentHash: createHash("sha256").update(`${url}\n${input.title}\n${text}${labels.length ? `\n${labels.join("|")}` : ""}`).digest("hex"),
  });
  return parsed.success ? parsed.data : null;
}

export function toIsoDate(raw: string): string | null {
  const time = Date.parse(raw);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

export type SourceFetchResult = {
  source: FeedSource;
  articles: ArticleSnapshot[];
  rejected: number;
};

/** fetch with a timeout and a clear error message naming the source. */
export async function fetchWithTimeout(source: FeedSource, url: string, timeoutMs: number): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": "DaylineBot/0.1 (hackathon prototype)" } });
  } catch (error) {
    throw new Error(`${source.id}: ${(error as Error).name === "TimeoutError" ? `timed out after ${timeoutMs} ms` : (error as Error).message}`);
  }
  if (!response.ok) {
    throw new Error(`${source.id}: HTTP ${response.status}`);
  }
  return response;
}
