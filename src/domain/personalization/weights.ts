import { z } from "zod";
import { topicIdSchema, topicLabel, type TopicId } from "@/domain/topics";

/**
 * Feedback policy. Weights are derived from the full set of current signals,
 * not accumulated per click, so retries and double-clicks cannot compound.
 */
export const WEIGHT_POLICY = {
  baseline: 1.0,
  step: 0.25,
  min: 0.25,
  max: 2.0,
} as const;

export const feedbackSignalSchema = z.enum(["more", "less"]);
export type FeedbackSignal = z.infer<typeof feedbackSignalSchema>;

export type TopicWeights = Partial<Record<TopicId, number>>;

/** One current signal for one story in one edition. */
export type StoredSignal = {
  editionId: string;
  articleHash: string;
  topics: TopicId[];
  signal: FeedbackSignal;
  sourceId?: string | null;
};

export const topicWeightsSchema = z.partialRecord(topicIdSchema, z.number());

function clamp(value: number): number {
  return Math.min(WEIGHT_POLICY.max, Math.max(WEIGHT_POLICY.min, value));
}

/** Baseline for each selected topic plus ±step per signal touching it, clamped once at the end. Order-independent. */
export function deriveTopicWeights(selectedTopics: TopicId[], signals: StoredSignal[], behaviorShift: Partial<Record<TopicId, number>> = {}): TopicWeights {
  const weights: TopicWeights = {};
  for (const topic of selectedTopics) {
    weights[topic] = WEIGHT_POLICY.baseline;
  }
  for (const { topics, signal } of signals) {
    for (const topic of topics) {
      const current = weights[topic];
      if (current !== undefined) {
        weights[topic] = current + (signal === "more" ? WEIGHT_POLICY.step : -WEIGHT_POLICY.step);
      }
    }
  }
  for (const topic of selectedTopics) {
    weights[topic] = clamp((weights[topic] ?? WEIGHT_POLICY.baseline) + (behaviorShift[topic] ?? 0));
  }
  return weights;
}

/** Replaces any existing signal for the same edition + story; the same signal twice is a no-op. */
export function applySignal(signals: StoredSignal[], next: StoredSignal): StoredSignal[] {
  const others = signals.filter((s) => !(s.editionId === next.editionId && s.articleHash === next.articleHash));
  return [...others, next];
}

/** Stored weights if present and covering the selected topics; otherwise baseline weights. */
export function effectiveWeights(selectedTopics: TopicId[], stored: TopicWeights | null | undefined): TopicWeights {
  const weights: TopicWeights = {};
  for (const topic of selectedTopics) {
    const value = stored?.[topic];
    weights[topic] = typeof value === "number" && Number.isFinite(value) ? clamp(value) : WEIGHT_POLICY.baseline;
  }
  return weights;
}

export type WeightChange = { topic: TopicId; label: string; direction: "stronger" | "weaker"; weight: number };

export function describeWeightChanges(before: TopicWeights, after: TopicWeights): WeightChange[] {
  return (Object.keys(after) as TopicId[])
    .filter((topic) => (after[topic] ?? 0) !== (before[topic] ?? WEIGHT_POLICY.baseline))
    .map((topic) => ({
      topic,
      label: topicLabel(topic),
      direction: (after[topic] ?? 0) > (before[topic] ?? WEIGHT_POLICY.baseline) ? "stronger" : "weaker",
      weight: after[topic] ?? WEIGHT_POLICY.baseline,
    }));
}

/** Plain-language level for a weight, used by the preferences panel and ranking reasons. */
export function describeWeight(weight: number): "more" | "standard" | "less" {
  if (weight > WEIGHT_POLICY.baseline) {
    return "more";
  }
  return weight < WEIGHT_POLICY.baseline ? "less" : "standard";
}
