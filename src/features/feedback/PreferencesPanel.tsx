import Link from "next/link";
import { describeWeight, type TopicWeights } from "@/domain/personalization/weights";
import { topicLabel, type TopicId } from "@/domain/topics";
import { ui } from "@/features/shared/ui";

type PreferencesPanelProps = { topics: TopicId[]; weights: TopicWeights; previewHref: string | null };

const LEVELS = {
  more: { text: "More", className: "border-accent bg-accent-soft text-accent-strong" },
  standard: { text: "Standard", className: "border-rule bg-paper text-ink" },
  less: { text: "Less", className: "border-ink/30 bg-ink/5 text-muted" },
} as const;

function renderPreviewLink(previewHref: string | null) {
  if (!previewHref) {
    return null;
  }
  return (
    <Link href={previewHref} className={`${ui.secondaryButton} mt-4 w-full`}>
      Preview next edition
    </Link>
  );
}

export function PreferencesPanel({ topics, weights, previewHref }: PreferencesPanelProps) {
  const chips = topics.map((topic) => {
    const level = describeWeight(weights[topic] ?? 1);
    const { text, className } = LEVELS[level];
    return (
      <li key={topic} data-weight={level} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${className}`}>
        <span className="font-medium">{topicLabel(topic)}</span>
        <span aria-hidden="true">·</span>
        <span>{text}</span>
      </li>
    );
  });

  return (
    <section className={`${ui.card} p-5`} aria-labelledby="learning-heading">
      <h2 id="learning-heading" className="font-serif text-lg font-bold">
        How Dayline is learning your interests
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">{chips}</ul>
      <p className="mt-3 text-sm text-muted">
        Each More or Less nudges that story&apos;s topics for future papers. Choices are saved once per story, so you can change your mind.
      </p>
      {renderPreviewLink(previewHref)}
      <p className={`${ui.meta} mt-3`}>Your current paper stays unchanged.</p>
    </section>
  );
}
