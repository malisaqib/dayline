import { XMLParser } from "fast-xml-parser";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { htmlToText } from "@/shared/text";
import type { FeedSource } from "./catalog";
import { buildSnapshot, fetchWithTimeout, toIsoDate, type SourceFetchResult } from "./snapshot";

const FETCH_TIMEOUT_MS = 8000;
const MAX_FEED_BYTES = 2_000_000;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

type RawEntry = Record<string, unknown>;

export type FeedFetchResult = SourceFetchResult;

export function asText(value: unknown): string {
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

function toSnapshot(source: FeedSource, entry: RawEntry, fetchedAt: string): ArticleSnapshot | null {
  const fullText = htmlToText(asText(entry["content:encoded"]) || asText(entry.content));
  const summaryText = htmlToText(asText(entry.description) || asText(entry.summary));
  const useFull = fullText.length > summaryText.length;
  return buildSnapshot(
    source,
    {
      title: htmlToText(asText(entry.title)),
      url: entryLink(entry),
      publishedAt: toIsoDate(asText(entry.pubDate) || asText(entry.published) || asText(entry.updated) || asText(entry["dc:date"])),
      text: useFull ? fullText : summaryText,
      fromFullContentField: useFull,
    },
    fetchedAt,
  );
}

export async function fetchFeed(source: FeedSource): Promise<FeedFetchResult> {
  const response = await fetchWithTimeout(source, source.url, FETCH_TIMEOUT_MS);
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
