import { z } from "zod";
import type { TopicId } from "@/domain/topics";
import type { StoredSignal } from "./weights";

export const readingKindSchema = z.enum(["open", "skip"]);
export type ReadingKind = z.infer<typeof readingKindSchema>;

export type ReadingEvent = {
  editionId: string;
  articleHash: string;
  articleUrl: string;
  sourceId: string;
  topics: TopicId[];
  kind: ReadingKind;
};

export const BEHAVIOR_POLICY = {
  openTopicStep: 0.05,
  skipTopicStep: -0.1,
  maxTopicShift: 0.25,
  sourceSteps: { more: 0.05, less: -0.05, open: 0.02, skip: -0.04 },
  maxSourceAffinity: 0.1,
  skippedPenalty: 1,
} as const;

export type PersonalSignals = { sourceAffinity: Record<string, number>; skipped: Set<string> };

export const EMPTY_PERSONAL_SIGNALS: PersonalSignals = { sourceAffinity: {}, skipped: new Set() };

function bounded(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

export function behaviorTopicShift(events: ReadingEvent[]): Partial<Record<TopicId, number>> {
  const raw: Partial<Record<TopicId, number>> = {};
  for (const event of events) {
    const step = event.kind === "open" ? BEHAVIOR_POLICY.openTopicStep : BEHAVIOR_POLICY.skipTopicStep;
    for (const topic of event.topics) {
      raw[topic] = (raw[topic] ?? 0) + step;
    }
  }
  const shift: Partial<Record<TopicId, number>> = {};
  for (const topic of Object.keys(raw) as TopicId[]) {
    shift[topic] = bounded(raw[topic] ?? 0, BEHAVIOR_POLICY.maxTopicShift);
  }
  return shift;
}

export function deriveSourceAffinity(signals: (StoredSignal & { sourceId?: string | null })[], events: ReadingEvent[]): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const signal of signals) {
    if (signal.sourceId) {
      raw[signal.sourceId] = (raw[signal.sourceId] ?? 0) + BEHAVIOR_POLICY.sourceSteps[signal.signal];
    }
  }
  for (const event of events) {
    raw[event.sourceId] = (raw[event.sourceId] ?? 0) + BEHAVIOR_POLICY.sourceSteps[event.kind];
  }
  const affinity: Record<string, number> = {};
  for (const [source, value] of Object.entries(raw)) {
    affinity[source] = bounded(value, BEHAVIOR_POLICY.maxSourceAffinity);
  }
  return affinity;
}

export function skippedKeys(events: ReadingEvent[]): Set<string> {
  const keys = new Set<string>();
  for (const event of events) {
    if (event.kind === "skip") {
      keys.add(event.articleHash);
      keys.add(event.articleUrl);
    }
  }
  return keys;
}

export function personalSignals(signals: (StoredSignal & { sourceId?: string | null })[], events: ReadingEvent[]): PersonalSignals {
  return { sourceAffinity: deriveSourceAffinity(signals, events), skipped: skippedKeys(events) };
}
