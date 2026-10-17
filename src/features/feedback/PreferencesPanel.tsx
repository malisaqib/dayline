import Link from "next/link";
import type { TopicWeights } from "@/domain/personalization/weights";
import type { TopicId } from "@/domain/topics";
import { ui } from "@/features/shared/ui";
import { LearningChips } from "./LearningChips";

type PreferencesPanelProps = { topics: TopicId[]; weights: TopicWeights; previewHref: string | null };

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
  return (
    <section className={`${ui.card} p-5`} aria-labelledby="learning-heading">
      <h2 id="learning-heading" className="font-serif text-lg font-bold">
        How Dayline is learning your interests
      </h2>
      <LearningChips topics={topics} initialWeights={weights} />
      <p className="mt-3 text-sm text-muted">
        Each More or Less nudges that story&apos;s topics for future papers. Choices are saved once per story, so you can change your mind.
      </p>
      {renderPreviewLink(previewHref)}
      <p className={`${ui.meta} mt-3`}>Your current paper stays unchanged.</p>
    </section>
  );
}
