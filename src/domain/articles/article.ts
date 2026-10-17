import { z } from "zod";

/**
 * An immutable copy of one fetched article as it was seen at `fetchedAt`.
 * Editions and later continuity features must reference this snapshot (by
 * `contentHash`), never re-read a URL, so an old edition can't silently change.
 */
export const articleSnapshotSchema = z.object({
  sourceId: z.string().min(1),
  sourceName: z.string().min(1),
  title: z.string().min(1).max(500),
  url: z.url({ protocol: /^https?$/ }),
  publishedAt: z.iso.datetime().nullable(),
  fetchedAt: z.iso.datetime(),
  text: z.string(),
  coverage: z.enum(["full", "excerpt", "none"]),
  /** Compact source-supplied metadata shown as a kicker, e.g. "Actively exploited vulnerability". */
  labels: z.array(z.string().max(120)).max(6).default([]),
  contentHash: z.string().length(64),
});

export type ArticleSnapshot = z.infer<typeof articleSnapshotSchema>;
export type TextCoverage = ArticleSnapshot["coverage"];

const FULL_TEXT_MIN_CHARS = 1500;

export function classifyCoverage(text: string, fromFullContentField: boolean): TextCoverage {
  if (text.length === 0) {
    return "none";
  }
  return fromFullContentField && text.length >= FULL_TEXT_MIN_CHARS ? "full" : "excerpt";
}
