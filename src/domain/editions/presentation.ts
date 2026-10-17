import { bodyKindLabel, formatEditionDate, type Edition, type StorySnapshot } from "./edition";

/**
 * View data shared by the web page and the PDF. Both renderers consume this one
 * function's output, so story order and text cannot drift between them.
 */
export type PresentedStory = {
  headline: string;
  body: string;
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
    headline: story.title,
    body: story.body,
    meta: `${bodyKindLabel(story.bodyKind)} · published ${formatPublished(story.publishedAt)}`,
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
