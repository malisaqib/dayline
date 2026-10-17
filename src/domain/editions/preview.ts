import { scoreItem } from "@/domain/personalization/rank";
import type { TopicWeights } from "@/domain/personalization/weights";
import type { StorySnapshot } from "./edition";

export const PREVIEW_LABEL = "Preview based on today’s available stories.";

/**
 * Reorders an edition's saved stories with the reader's current weights.
 * Returns new objects: the saved snapshot is never modified. Bodies and
 * takeaways are reused as stored, so a preview needs no model calls.
 * Ties keep the original edition order.
 */
export function previewStories(stories: readonly StorySnapshot[], weights: TopicWeights, now: Date): StorySnapshot[] {
  return stories
    .map((story, position) => ({ story, position, scored: scoreItem(story, weights, now) }))
    .sort((a, b) => b.scored.score - a.scored.score || a.position - b.position)
    .map(({ story, scored }) => ({ ...story, reasons: scored.reasons }));
}
