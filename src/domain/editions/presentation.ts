import { bodyKindLabel, formatEditionDate, type Edition, type StorySnapshot } from "./edition";

/**
 * View data shared by the web page and the PDF. Both renderers consume this one
 * function's output, so story order and text cannot drift between them.
 */
export type PresentedStory = {
  /** Article content hash; identifies the story for feedback. */
  id: string;
  headline: string;
  body: string;
  takeaways: string[];
  meta: string;
  reasons: string[];
  sourceName: string;
  sourceUrl: string;
};

export type PresentedEdition = {
  dateLabel: string;
  timezone: string;
  editionLabel: string;
  stories: PresentedStory[];
};

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
    body: story.body,
    takeaways: story.takeaways,
    meta: `${bodyKindLabel(story.bodyKind, story.coverage)} · published ${formatPublished(story.publishedAt)}`,
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
  };
}
