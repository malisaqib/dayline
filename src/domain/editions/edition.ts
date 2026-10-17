import { z } from "zod";
import { topicIdSchema } from "@/domain/topics";

export const EDITION_TIMEZONE = "Asia/Karachi";
export const MAX_EDITION_STORIES = 6;

/**
 * How a story's body text was produced. Readers see this label so a publisher
 * excerpt or bare headline is never presented as an AI-read article.
 */
export const bodyKindSchema = z.enum(["ai_summary", "publisher_excerpt", "headline_only"]);
export type BodyKind = z.infer<typeof bodyKindSchema>;

export const storySnapshotSchema = z.object({
  articleHash: z.string().length(64),
  sourceId: z.string(),
  sourceName: z.string(),
  title: z.string(),
  url: z.url({ protocol: /^https?$/ }),
  publishedAt: z.iso.datetime().nullable(),
  fetchedAt: z.iso.datetime(),
  topics: z.array(topicIdSchema),
  reasons: z.array(z.string()),
  body: z.string(),
  bodyKind: bodyKindSchema,
  // Added with the OpenRouter summaries; defaults keep earlier saved editions readable.
  takeaways: z.array(z.string()).default([]),
  coverage: z.enum(["full", "excerpt", "none"]).default("excerpt"),
  labels: z.array(z.string()).default([]),
  summaryModel: z.string().nullable(),
  summaryPromptVersion: z.string().nullable(),
});

export type StorySnapshot = z.infer<typeof storySnapshotSchema>;

export const editionStoriesSchema = z.array(storySnapshotSchema).min(1).max(MAX_EDITION_STORIES);

// `weights` were added in Phase 2; older snapshots only have topics.
export const profileSnapshotSchema = z.object({ topics: z.array(topicIdSchema), weights: z.partialRecord(topicIdSchema, z.number()).optional() });
export type ProfileSnapshot = z.infer<typeof profileSnapshotSchema>;

export type Edition = {
  id: string;
  userId: string;
  localDate: string;
  timezone: string;
  generatedAt: string;
  sourcesFetchedAt: string;
  profile: ProfileSnapshot;
  stories: StorySnapshot[];
};

export type EditionSummary = Pick<Edition, "id" | "localDate" | "generatedAt"> & { leadTitle: string; storyCount: number };

/** YYYY-MM-DD for `now` in the edition timezone. */
export function localEditionDate(now: Date, timezone = EDITION_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function formatEditionDate(localDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${localDate}T00:00:00Z`));
}

export function bodyKindLabel(kind: BodyKind, coverage: StorySnapshot["coverage"]): string {
  switch (kind) {
    case "ai_summary":
      return coverage === "full" ? "AI summary of the full article text" : "AI summary of the publisher's excerpt";
    case "publisher_excerpt":
      return "Publisher's excerpt";
    case "headline_only":
      return "Headline only: open the original to read";
  }
}
