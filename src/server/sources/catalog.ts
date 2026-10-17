import type { SourceUsage } from "@/domain/sources/usage";
import type { TopicId } from "@/domain/topics";

export type FeedSource = {
  id: string;
  name: string;
  url: string;
  topics: TopicId[];
  enabled: boolean;
  usage: SourceUsage;
  /** What we know about reuse rights. Only NASA has a known basis; the rest are unverified. */
  reuseNote: string;
};

const EXCERPT_UNVERIFIED: SourceUsage = { display: "excerpt", aiProcessing: false, basis: "unverified" };

/**
 * Fetchability was checked in Phase 0. Usage is deliberately conservative: only
 * NASA (US government work) is sent to the model; the others are shown as the
 * publisher's own feed excerpt with a link, the way a feed reader shows them.
 */
export const SOURCES: FeedSource[] = [
  {
    id: "nasa",
    name: "NASA",
    url: "https://www.nasa.gov/news-release/feed/",
    topics: ["space", "science"],
    enabled: true,
    usage: { display: "excerpt", aiProcessing: true, basis: "public_domain" },
    reuseNote: "US government work, generally public domain; NASA media guidelines and third-party images still apply.",
  },
  {
    id: "npr",
    name: "NPR News",
    url: "https://feeds.npr.org/1001/rss.xml",
    topics: ["world"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "RSS offered for personal, non-commercial use; AI summarisation not explicitly permitted. Unresolved.",
  },
  {
    id: "ars",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    topics: ["technology"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "Condé Nast terms; RSS for personal use. AI processing of full text unresolved.",
  },
  {
    id: "dawn",
    name: "Dawn",
    url: "https://www.dawn.com/feeds/home",
    topics: ["pakistan"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "Feed includes long article text; republication rights unclear. Short excerpt plus link only until checked.",
  },
  {
    // Dawn returns HTTP 403 to Vercel's servers, so Pakistan coverage also needs the feeds below.
    id: "geo",
    name: "Geo News",
    url: "https://www.geo.tv/rss/1/1",
    topics: ["pakistan"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "Geo/Jang Group terms; RSS reuse and AI processing unverified. Excerpt plus link only.",
  },
  {
    id: "app",
    name: "Associated Press of Pakistan",
    url: "https://www.app.com.pk/feed/",
    topics: ["pakistan"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "State news agency; reuse terms not reviewed. Excerpt plus link only.",
  },
  {
    id: "bbc",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    topics: ["world"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "BBC RSS terms allow headline/summary display in feed readers for personal use; restrict AI reuse.",
  },
  {
    id: "sciencedaily",
    name: "ScienceDaily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    topics: ["science"],
    enabled: true,
    usage: EXCERPT_UNVERIFIED,
    reuseNote: "Releases come from institutions; ScienceDaily terms on reuse of its summaries unresolved.",
  },
];

export const ENABLED_SOURCES = SOURCES.filter((s) => s.enabled);

export function sourceById(id: string): FeedSource | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function usageFor(sourceId: string): SourceUsage {
  const source = sourceById(sourceId);
  if (!source) {
    throw new Error(`unknown source ${sourceId}`);
  }
  return source.usage;
}

/** Topics offered in onboarding: only those at least one enabled source covers. */
export function supportedTopicIds(): Set<TopicId> {
  return new Set(ENABLED_SOURCES.flatMap((s) => s.topics));
}
