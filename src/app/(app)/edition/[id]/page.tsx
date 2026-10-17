import Link from "next/link";
import { notFound } from "next/navigation";
import { presentEdition, type PresentedEdition, type PresentedStory } from "@/domain/editions/presentation";
import { buildSignalBrief } from "@/domain/editions/signal-brief";
import { FeedbackControls } from "@/features/feedback/FeedbackControls";
import { storyWrapper } from "@/features/feedback/story-wrapper";
import { PreferencesPanel } from "@/features/feedback/PreferencesPanel";
import { EditionView } from "@/features/newspaper/EditionView";
import { SignalBrief } from "@/features/newspaper/SignalBrief";
import { ui } from "@/features/shared/ui";
import { readOwnEditionWithContext, type EditionContext } from "@/server/services/read-edition";

export const dynamic = "force-dynamic";

type SearchParams = { welcome?: string; sources?: string };

function renderNotices(params: SearchParams) {
  const notices = [];
  if (params.welcome === "1") {
    notices.push(
      <div key="welcome" role="status" className="animate-toast rounded-xl border border-accent/30 bg-accent-soft px-4 py-3">
        <p className="font-semibold text-accent-strong">Your paper is ready.</p>
        <p className="text-sm">Start with the Signal Brief below. A new paper is prepared every morning at 06:00 Pakistan time, and More, Less or Skip on any story shapes the next one.</p>
      </div>,
    );
  }
  if (params.sources === "partial") {
    notices.push(
      <div key="partial" role="status" className="rounded-xl border border-rule bg-card px-4 py-3 text-sm">
        <p className="font-semibold">Some sources were unavailable this morning.</p>
        <p className="text-muted">Your paper uses the stories we could reach. Every link still goes to the original publisher.</p>
      </div>,
    );
  }
  return notices;
}

function renderActions(editionId: string) {
  return (
    <>
      <a href={`/api/editions/${editionId}/pdf`} className={`${ui.primaryButton} col-span-2`}>
        Download PDF
      </a>
      <Link href="/archive" className={ui.secondaryButton}>
        Archive
      </Link>
      <Link href="/onboarding" className={ui.secondaryButton}>
        Edit topics
      </Link>
    </>
  );
}

function renderBrief(presented: PresentedEdition, context: EditionContext) {
  const topics = context.profile ? context.profile.topics : context.edition.profile.topics;
  const weights = context.profile ? context.profile.weights : {};
  const brief = buildSignalBrief(presented.stories, topics, weights, context.edition.todayInThree);
  if (!brief) {
    return null;
  }
  return <SignalBrief brief={brief} dateLabel={presented.dateLabel} />;
}

function renderRail(context: EditionContext) {
  if (!context.profile) {
    return null;
  }
  return <PreferencesPanel topics={context.profile.topics} weights={context.profile.weights} previewHref={`/edition/${context.edition.id}/preview`} />;
}

export default async function EditionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const context = await readOwnEditionWithContext(id);
  if (!context) {
    notFound();
  }
  const { edition, signals } = context;
  const presented = presentEdition(edition);
  const footer = (story: PresentedStory) => (
    <FeedbackControls editionId={edition.id} articleHash={story.id} topicLabels={story.topicLabels} initial={signals[story.id] ?? null} />
  );

  return (
    <EditionView
      edition={presented}
      eyebrow="Your morning paper"
      actions={renderActions(edition.id)}
      notices={renderNotices(query)}
      brief={renderBrief(presented, context)}
      storyFooter={footer}
      storyWrapper={storyWrapper(context.edition.id, context.reading)}
      rail={renderRail(context)}
    />
  );
}
