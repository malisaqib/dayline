import type { TopicId } from "@/domain/topics";
import type { ReadingEvent } from "./behavior";
import { WEIGHT_POLICY, type StoredSignal, type TopicWeights } from "./weights";

export const LEARNING_POLICY = {
  halfLifeDays: 14,
  explicitStep: WEIGHT_POLICY.step,
  openStep: 0.05,
  skipStep: -0.1,
  maxBehaviorShift: 0.25,
  skipMemoryDays: 30,
  repeatWindowDays: 3,
  repeatPenalty: 0.3,
} as const;

const DAY_MS = 86_400_000;

export type Dated = { at?: string | null };

export function recencyFactor(at: string | null | undefined, now: Date): number {
  if (!at) {
    return 1;
  }
  const ageDays = Math.max(0, (now.getTime() - Date.parse(at)) / DAY_MS);
  return Math.pow(0.5, ageDays / LEARNING_POLICY.halfLifeDays);
}

function timeOf(item: Dated): number {
  if (!item.at) {
    return Number.POSITIVE_INFINITY;
  }
  return Date.parse(item.at);
}

function newer(a: Dated, b: Dated): boolean {
  return timeOf(a) > timeOf(b);
}

export function latestPerStory<T extends Dated & { articleHash: string }>(items: T[], keyOf: (item: T) => string = (item) => item.articleHash): T[] {
  const latest = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    const current = latest.get(key);
    if (!current || newer(item, current)) {
      latest.set(key, item);
    }
  }
  return [...latest.values()];
}

function clamp(value: number): number {
  return Math.min(WEIGHT_POLICY.max, Math.max(WEIGHT_POLICY.min, value));
}

function bounded(value: number): number {
  return Math.max(-LEARNING_POLICY.maxBehaviorShift, Math.min(LEARNING_POLICY.maxBehaviorShift, value));
}

function chronological<T extends Dated>(items: T[]): T[] {
  return [...items].sort((a, b) => timeOf(a) - timeOf(b));
}

export function learnedWeights(selectedTopics: TopicId[], signals: (StoredSignal & Dated)[], events: (ReadingEvent & Dated)[], now: Date): TopicWeights {
  const explicit: Partial<Record<TopicId, number>> = {};
  for (const topic of selectedTopics) {
    explicit[topic] = WEIGHT_POLICY.baseline;
  }
  for (const signal of chronological(latestPerStory(signals))) {
    const step = (signal.signal === "more" ? 1 : -1) * LEARNING_POLICY.explicitStep * recencyFactor(signal.at, now);
    for (const topic of signal.topics) {
      const current = explicit[topic];
      if (current !== undefined) {
        explicit[topic] = clamp(current + step);
      }
    }
  }
  const behavior: Partial<Record<TopicId, number>> = {};
  for (const event of latestPerStory(events, (e) => `${e.articleHash}:${e.kind}`)) {
    const base = event.kind === "open" ? LEARNING_POLICY.openStep : LEARNING_POLICY.skipStep;
    for (const topic of event.topics) {
      behavior[topic] = (behavior[topic] ?? 0) + base * recencyFactor(event.at, now);
    }
  }
  const weights: TopicWeights = {};
  for (const topic of selectedTopics) {
    weights[topic] = clamp((explicit[topic] ?? WEIGHT_POLICY.baseline) + bounded(behavior[topic] ?? 0));
  }
  return weights;
}

export function recentSkips(events: (ReadingEvent & Dated)[], now: Date): Set<string> {
  const keys = new Set<string>();
  for (const event of events) {
    const ageDays = (now.getTime() - Date.parse(event.at ?? now.toISOString())) / DAY_MS;
    if (event.kind === "skip" && ageDays <= LEARNING_POLICY.skipMemoryDays) {
      keys.add(event.articleHash);
      keys.add(event.articleUrl);
    }
  }
  return keys;
}
