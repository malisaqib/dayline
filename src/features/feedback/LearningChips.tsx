"use client";

import { useEffect, useState } from "react";
import { describeWeight, WEIGHT_POLICY, type TopicWeights } from "@/domain/personalization/weights";
import { topicLabel, type TopicId } from "@/domain/topics";

export const WEIGHTS_EVENT = "dayline:weights";

const LEVELS = {
  more: { text: "More", className: "border-accent bg-accent-soft text-accent-strong" },
  standard: { text: "Standard", className: "border-rule bg-paper text-ink" },
  less: { text: "Less", className: "border-ink/30 bg-ink/5 text-muted" },
} as const;

export function LearningChips({ topics, initialWeights }: { topics: TopicId[]; initialWeights: TopicWeights }) {
  const [weights, setWeights] = useState<TopicWeights>(initialWeights);

  useEffect(() => {
    function onWeights(event: Event) {
      setWeights((event as CustomEvent<TopicWeights>).detail);
    }
    window.addEventListener(WEIGHTS_EVENT, onWeights);
    return () => window.removeEventListener(WEIGHTS_EVENT, onWeights);
  }, []);

  const chips = topics.map((topic) => {
    const level = describeWeight(weights[topic] ?? WEIGHT_POLICY.baseline);
    const { text, className } = LEVELS[level];
    return (
      <li key={topic} data-weight={level} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors duration-[300ms] ${className}`}>
        <span className="font-medium">{topicLabel(topic)}</span>
        <span aria-hidden="true">·</span>
        <span>{text}</span>
      </li>
    );
  });

  return <ul className="mt-3 flex flex-wrap gap-2">{chips}</ul>;
}
