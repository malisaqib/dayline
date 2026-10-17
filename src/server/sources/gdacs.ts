import { XMLParser } from "fast-xml-parser";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { htmlToText } from "@/shared/text";
import type { FeedSource } from "./catalog";
import { asText } from "./rss";
import { buildSnapshot, fetchWithTimeout, toIsoDate, type SourceFetchResult } from "./snapshot";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_FEED_BYTES = 4_000_000;
export const GDACS_MAX_ITEMS = 10;
const GREEN_FALLBACK_ITEMS = 3;

const EVENT_TYPES: Record<string, string> = {
  EQ: "Earthquake",
  TC: "Tropical cyclone",
  FL: "Flood",
  VO: "Volcano",
  DR: "Drought",
  WF: "Wildfire",
  TS: "Tsunami",
};
const ALERT_RANK: Record<string, number> = { Red: 3, Orange: 2, Green: 1 };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

export type GdacsAlert = {
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  eventType: string;
  alertLevel: string;
  country: string;
  severity: string;
};

// GDACS text often has a space before punctuation ("is 3815 ."), which wraps badly.
function tidy(text: string): string {
  return htmlToText(text).replace(/\s+([.,;:])/g, "$1");
}

function toAlert(item: Record<string, unknown>): GdacsAlert | null {
  const title = tidy(asText(item.title));
  const link = asText(item.link).trim();
  const publishedAt = toIsoDate(asText(item.pubDate) || asText(item["gdacs:dateadded"]));
  const alertLevel = asText(item["gdacs:alertlevel"]).trim();
  if (!title || !link || !publishedAt || !(alertLevel in ALERT_RANK)) {
    return null;
  }
  const code = asText(item["gdacs:eventtype"]).trim();
  return {
    title,
    description: tidy(asText(item.description)),
    link,
    publishedAt,
    eventType: EVENT_TYPES[code] ?? code,
    alertLevel,
    country: htmlToText(asText(item["gdacs:country"])),
    severity: htmlToText(asText(item["gdacs:severity"])),
  };
}

/**
 * Pure: valid current alerts, Orange/Red first. Green alerts are low impact, so
 * they are used only when there is no Orange or Red alert, and then sparingly.
 */
export function parseGdacsRss(xml: string): { alerts: GdacsAlert[]; rejected: number } {
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item ?? [];
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw];
  // The XML parser may turn "false" into a boolean, so compare the string form.
  const valid = items.filter((i) => String(i["gdacs:iscurrent"] ?? "").trim() !== "false").map(toAlert);
  const alerts = valid.filter((a): a is GdacsAlert => a !== null);
  const byRecency = (a: GdacsAlert, b: GdacsAlert) => b.publishedAt.localeCompare(a.publishedAt) || a.link.localeCompare(b.link);
  const serious = alerts.filter((a) => ALERT_RANK[a.alertLevel] >= 2).sort((a, b) => ALERT_RANK[b.alertLevel] - ALERT_RANK[a.alertLevel] || byRecency(a, b));
  const selected = serious.length > 0 ? serious.slice(0, GDACS_MAX_ITEMS) : alerts.sort(byRecency).slice(0, GREEN_FALLBACK_ITEMS);
  return { alerts: selected, rejected: valid.length - alerts.length };
}

function toSnapshot(source: FeedSource, alert: GdacsAlert, fetchedAt: string): ArticleSnapshot | null {
  const labels = ["Disaster alert", alert.eventType, alert.country, `${alert.alertLevel} alert`, alert.severity].filter(Boolean).map((l) => l.slice(0, 120));
  return buildSnapshot(
    source,
    { title: alert.title, url: alert.link, publishedAt: alert.publishedAt, text: alert.description, fromFullContentField: false, labels },
    fetchedAt,
  );
}

export async function fetchGdacs(source: FeedSource): Promise<SourceFetchResult> {
  const response = await fetchWithTimeout(source, source.url, FETCH_TIMEOUT_MS);
  const body = await response.text();
  if (body.length > MAX_FEED_BYTES) {
    throw new Error(`${source.id}: feed exceeds ${MAX_FEED_BYTES} bytes`);
  }
  const { alerts, rejected } = parseGdacsRss(body);
  const fetchedAt = new Date().toISOString();
  const articles = alerts.map((a) => toSnapshot(source, a, fetchedAt)).filter((a): a is ArticleSnapshot => a !== null);
  return { source, articles, rejected: rejected + alerts.length - articles.length };
}
