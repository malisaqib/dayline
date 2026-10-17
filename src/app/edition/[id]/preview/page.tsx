import Link from "next/link";
import { notFound } from "next/navigation";
import { PREVIEW_LABEL, previewStories } from "@/domain/editions/preview";
import { presentEdition, type PresentedStory } from "@/domain/editions/presentation";
import { FeedbackControls } from "@/features/feedback/FeedbackControls";
import { storyWrapper } from "@/features/feedback/story-wrapper";
import { PreferencesPanel } from "@/features/feedback/PreferencesPanel";
import { EditionView } from "@/features/newspaper/EditionView";
import { ui } from "@/features/shared/ui";
import { readOwnEditionWithContext } from "@/server/services/read-edition";

export const dynamic = "force-dynamic";

function renderBanner(editionId: string) {
  return (
    <div role="note" className="animate-fade-up rounded-xl border-2 border-dashed border-accent bg-accent-soft px-4 py-4 sm:px-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-strong">Preview only</p>
      <p className="mt-1 font-semibold">This is how your next paper may look. Your saved paper is unchanged.</p>
      <p className="mt-1 text-sm text-muted">{PREVIEW_LABEL} Tomorrow&apos;s paper will use tomorrow&apos;s news with these preferences.</p>
      <Link href={`/edition/${editionId}`} className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent-strong underline-offset-4 hover:underline">
        ← Back to today&apos;s saved paper
      </Link>
    </div>
  );
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await readOwnEditionWithContext(id);
  if (!context?.profile) {
    notFound();
  }
  const { edition, profile, signals } = context;
  const presented = presentEdition({ ...edition, stories: previewStories(edition.stories, profile.weights, new Date(), context.personal) });
  const footer = (story: PresentedStory) => (
    <FeedbackControls editionId={edition.id} articleHash={story.id} topicLabels={story.topicLabels} initial={signals[story.id] ?? null} />
  );

  return (
    <EditionView
      edition={{ ...presented, editionLabel: "Preview · not saved" }}
      eyebrow="Next edition preview"
      actions={
        <Link href={`/edition/${edition.id}`} className={`${ui.primaryButton} col-span-2`}>
          Back to today&apos;s paper
        </Link>
      }
      notices={renderBanner(edition.id)}
      storyFooter={footer}
      storyWrapper={storyWrapper(context.edition.id, context.reading)}
      rail={<PreferencesPanel topics={profile.topics} weights={profile.weights} previewHref={null} />}
    />
  );
}
