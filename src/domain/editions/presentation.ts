import { topicLabel, type TopicId } from "@/domain/topics";
import { bodyKindLabel, formatEditionDate, type BodyKind, type Edition, type StorySnapshot } from "./edition";

/**
 * View data shared by the web page and the PDF. Both renderers consume this one
 * function's output, so story order and text cannot drift between them.
 */
export type PresentedStory = {
  /** Article content hash; identifies the story for feedback. */
  id: string;
  headline: string;
  /** Source-supplied kicker, e.g. "Actively exploited vulnerability · CVE-2025-1234". Empty for ordinary news. */
  kicker: string;
  body: string;
  takeaways: string[];
  meta: string;
  bodyLabel: string;
  publishedLabel: string;
  topicLabels: string[];
  topics: TopicId[];
  readingMinutes: number | null;
  words: number;
  reasons: string[];
  sourceName: string;
  sourceUrl: string;
};

const WORDS_PER_MINUTE = 200;

const SHORT_BODY_LABELS: Record<BodyKind, string> = {
  ai_summary: "AI summary",
  publisher_excerpt: "Publisher's excerpt",
  headline_only: "Headline only",
};

function visibleWords(story: StorySnapshot): number {
  return [story.title, story.body, ...story.takeaways].join(" ").split(/\s+/).filter(Boolean).length;
}

function readingMinutes(story: StorySnapshot): number | null {
  if (story.bodyKind === "headline_only") {
    return null;
  }
  return Math.max(1, Math.ceil(visibleWords(story) / WORDS_PER_MINUTE));
}

export function estimatedReadingMinutes(stories: Pick<PresentedStory, "words">[]): number {
  const total = stories.reduce((sum, story) => sum + story.words, 0);
  return Math.max(1, Math.ceil(total / WORDS_PER_MINUTE));
}

function formatPublishedTime(iso: string | null): string {
  if (!iso) {
    return "Date unknown";
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }).format(new Date(iso));
}

export type PresentedEdition = {
  dateLabel: string;
  timezone: string;
  editionLabel: string;
  stories: PresentedStory[];
  highlights: PresentedHighlight[];
};

export type PresentedHighlight = { position: number; sentence: string; kind: "ai" | "quote"; sourceName: string; sourceUrl: string };

function presentHighlights(edition: Edition): PresentedHighlight[] {
  return edition.todayInThree.flatMap((item) => {
    const index = edition.stories.findIndex((story) => story.articleHash === item.articleHash);
    if (index < 0) {
      return [];
    }
    const story = edition.stories[index];
    return [{ position: index + 1, sentence: item.sentence, kind: item.kind, sourceName: story.sourceName, sourceUrl: story.url }];
  });
}

function formatPublished(iso: string | null): string {
  if (!iso) {
    return "date unknown";
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }).format(new Date(iso));
}

function presentStory(story: StorySnapshot): PresentedStory {
  return {
    id: story.articleHash,
    headline: story.title,
    kicker: story.labels.join(" · "),
    body: story.body,
    takeaways: story.takeaways,
    meta: `${bodyKindLabel(story.bodyKind, story.coverage)} · published ${formatPublished(story.publishedAt)}`,
    bodyLabel: SHORT_BODY_LABELS[story.bodyKind],
    publishedLabel: formatPublishedTime(story.publishedAt),
    topicLabels: story.topics.map(topicLabel),
    topics: story.topics,
    readingMinutes: readingMinutes(story),
    words: visibleWords(story),
    reasons: story.reasons,
    sourceName: story.sourceName,
    sourceUrl: story.url,
  };
}

export function presentEdition(edition: Edition): PresentedEdition {
  return {
    dateLabel: formatEditionDate(edition.localDate),
    timezone: edition.timezone,
    editionLabel: `Edition ${edition.id.slice(0, 8)}`,
    stories: edition.stories.map(presentStory),
    highlights: presentHighlights(edition),
  };
}
