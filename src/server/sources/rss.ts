import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { articleSnapshotSchema, classifyCoverage, type ArticleSnapshot } from "@/domain/articles/article";
import { htmlToText } from "@/shared/text";
import type { FeedSource } from "./catalog";

const FETCH_TIMEOUT_MS = 8000;
const MAX_FEED_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 6000;
const USER_AGENT = "DaylineBot/0.1 (hackathon prototype)";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

type RawEntry = Record<string, unknown>;

export type FeedFetchResult = {
  source: FeedSource;
  articles: ArticleSnapshot[];
  rejected: number;
};

function asText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object" && "#text" in value) {
    return String((value as RawEntry)["#text"]);
  }
  return "";
}

function entryLink(entry: RawEntry): string {
  const link = entry.link;
  if (link && typeof link === "object") {
    const links = (Array.isArray(link) ? link : [link]) as RawEntry[];
    const alternate = links.find((l) => l["@_rel"] === "alternate") ?? links[0];
    return asText(alternate?.["@_href"] ?? alternate);
  }
  return asText(link);
}

function toIsoDate(raw: string): string | null {
  const time = Date.parse(raw);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function toSnapshot(source: FeedSource, entry: RawEntry, fetchedAt: string): ArticleSnapshot | null {
  const fullText = htmlToText(asText(entry["content:encoded"]) || asText(entry.content));
  const summaryText = htmlToText(asText(entry.description) || asText(entry.summary));
  const useFull = fullText.length > summaryText.length;
  const text = (useFull ? fullText : summaryText).slice(0, MAX_TEXT_CHARS);
  const title = htmlToText(asText(entry.title));
  const url = entryLink(entry).trim();

  const candidate = {
    sourceId: source.id,
    sourceName: source.name,
    title,
    url,
    publishedAt: toIsoDate(asText(entry.pubDate) || asText(entry.published) || asText(entry.updated) || asText(entry["dc:date"])),
    fetchedAt,
    text,
    coverage: classifyCoverage(text, useFull),
    contentHash: createHash("sha256").update(`${url}\n${title}\n${text}`).digest("hex"),
  };

  const parsed = articleSnapshotSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export async function fetchFeed(source: FeedSource): Promise<FeedFetchResult> {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`${source.id}: HTTP ${response.status}`);
  }

  const body = await response.text();
  if (body.length > MAX_FEED_BYTES) {
    throw new Error(`${source.id}: feed exceeds ${MAX_FEED_BYTES} bytes`);
  }

  const doc = parser.parse(body);
  const raw = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? doc?.["rdf:RDF"]?.item ?? [];
  const entries: RawEntry[] = Array.isArray(raw) ? raw : [raw];
  const fetchedAt = new Date().toISOString();
  const articles = entries
    .map((entry) => toSnapshot(source, entry, fetchedAt))
    .filter((article): article is ArticleSnapshot => article !== null);

  return { source, articles, rejected: entries.length - articles.length };
}
