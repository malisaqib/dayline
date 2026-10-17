import { z } from "zod";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { MAX_AGE_HOURS } from "@/domain/personalization/rank";
import type { FeedSource } from "./catalog";
import { buildSnapshot, fetchWithTimeout, type SourceFetchResult } from "./snapshot";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_CATALOG_BYTES = 8_000_000;
export const KEV_MAX_ITEMS = 8;
const KEV_BASE_IMPORTANCE = 0.4;
const KEV_RANSOMWARE_IMPORTANCE = 0.7;
const CATALOG_PAGE = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const catalogSchema = z.object({ vulnerabilities: z.array(z.unknown()) });

// Only the official fields Dayline shows; everything else in the entry is ignored.
const entrySchema = z.object({
  cveID: z.string().regex(/^CVE-\d{4}-\d{4,}$/),
  vendorProject: z.string().min(1),
  product: z.string().min(1),
  vulnerabilityName: z.string().min(1),
  dateAdded: isoDay,
  shortDescription: z.string().min(1),
  requiredAction: z.string().min(1),
  dueDate: isoDay,
  knownRansomwareCampaignUse: z.string().optional(),
});

type KevEntry = z.infer<typeof entrySchema>;

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

function toSnapshot(source: FeedSource, entry: KevEntry, fetchedAt: string): ArticleSnapshot | null {
  const labels = ["Actively exploited vulnerability", entry.cveID, `${entry.vendorProject} ${entry.product}`.slice(0, 120), `Remediate by ${entry.dueDate}`];
  if (entry.knownRansomwareCampaignUse === "Known") {
    labels.push("Known ransomware use");
  }
  return buildSnapshot(
    source,
    {
      title: entry.vulnerabilityName,
      url: `${CATALOG_PAGE}?search_api_fulltext=${encodeURIComponent(entry.cveID)}`,
      publishedAt: `${entry.dateAdded}T00:00:00.000Z`,
      text: `${entry.shortDescription} CISA required action: ${firstSentence(entry.requiredAction)} Federal remediation due date: ${entry.dueDate}.`,
      fromFullContentField: false,
      labels,
      importance: entry.knownRansomwareCampaignUse === "Known" ? KEV_RANSOMWARE_IMPORTANCE : KEV_BASE_IMPORTANCE,
    },
    fetchedAt,
  );
}

/**
 * Pure: the most recently added catalog entries within the edition age limit.
 * Malformed entries are counted as rejected; a malformed catalog throws.
 */
export function parseKevCatalog(json: unknown, source: FeedSource, now: Date, fetchedAt: string): Omit<SourceFetchResult, "source"> {
  const catalog = catalogSchema.safeParse(json);
  if (!catalog.success) {
    throw new Error(`${source.id}: catalog JSON has no vulnerabilities array`);
  }
  const cutoff = now.getTime() - MAX_AGE_HOURS * 3_600_000;
  let rejected = 0;
  const recent: KevEntry[] = [];
  for (const raw of catalog.data.vulnerabilities) {
    const entry = entrySchema.safeParse(raw);
    if (!entry.success) {
      rejected += 1;
      continue;
    }
    if (Date.parse(`${entry.data.dateAdded}T00:00:00Z`) >= cutoff) {
      recent.push(entry.data);
    }
  }
  recent.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || a.cveID.localeCompare(b.cveID));

  const articles: ArticleSnapshot[] = [];
  for (const entry of recent.slice(0, KEV_MAX_ITEMS)) {
    const snapshot = toSnapshot(source, entry, fetchedAt);
    if (snapshot) {
      articles.push(snapshot);
    } else {
      rejected += 1;
    }
  }
  return { articles, rejected };
}

export async function fetchKev(source: FeedSource): Promise<SourceFetchResult> {
  const response = await fetchWithTimeout(source, source.url, FETCH_TIMEOUT_MS);
  const body = await response.text();
  if (body.length > MAX_CATALOG_BYTES) {
    throw new Error(`${source.id}: catalog exceeds ${MAX_CATALOG_BYTES} bytes`);
  }
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`${source.id}: response is not valid JSON`);
  }
  const now = new Date();
  return { source, ...parseKevCatalog(json, source, now, now.toISOString()) };
}
