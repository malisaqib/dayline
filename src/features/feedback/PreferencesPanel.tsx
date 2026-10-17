import { describeWeight, type TopicWeights } from "@/domain/personalization/weights";
import { topicLabel, type TopicId } from "@/domain/topics";

const LEVEL_TEXT = { more: "showing more", standard: "standard", less: "showing less" } as const;

export function PreferencesPanel({ topics, weights, previewHref }: { topics: TopicId[]; weights: TopicWeights; previewHref: string }) {
  return (
    <aside className="mt-10 rounded border border-rule px-4 py-3 text-sm" aria-labelledby="prefs-heading">
      <h2 id="prefs-heading" className="font-serif text-lg font-bold">
        Your preferences
      </h2>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {topics.map((topic) => (
          <li key={topic}>
            <span className="font-medium">{topicLabel(topic)}</span>: {LEVEL_TEXT[describeWeight(weights[topic] ?? 1)]}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink/60">
        Learned from your More/Less choices. Today&apos;s paper stays as published; changes apply to future papers.{" "}
        <a href={previewHref} className="font-medium text-accent hover:underline">
          Preview next edition
        </a>
      </p>
    </aside>
  );
}
