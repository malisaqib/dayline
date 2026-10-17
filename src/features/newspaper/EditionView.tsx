import type { ReactNode } from "react";
import { estimatedReadingMinutes, type PresentedEdition, type PresentedStory } from "@/domain/editions/presentation";
import { topicLabel } from "@/domain/topics";
import { RevealItem, RevealList } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
import { FilteredStory, FilterNav, FilterNotice, PaperFilterProvider, type TopicCount } from "./PaperFilters";
import { ReadingProgress } from "./ReadingProgress";
import { StoryCard } from "./StoryCard";

type StoryFooter = (story: PresentedStory) => ReactNode;
type StoryWrapper = (story: PresentedStory, card: ReactNode) => ReactNode;

const keepCard: StoryWrapper = (_story, card) => card;

type EditionViewProps = {
  edition: PresentedEdition;
  eyebrow: string;
  actions: ReactNode;
  notices?: ReactNode;
  brief?: ReactNode;
  storyFooter: StoryFooter;
  storyWrapper?: StoryWrapper;
  rail?: ReactNode;
};

function storyCountLabel(count: number): string {
  if (count === 1) {
    return "1 story";
  }
  return `${count} stories`;
}

function topicCounts(stories: PresentedStory[]): TopicCount[] {
  const counts = new Map<string, number>();
  for (const story of stories) {
    for (const topic of story.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([topic, count]) => ({ topic, label: topicLabel(topic as PresentedStory["topics"][number]), count }));
}

function renderPaperBar(stories: PresentedStory[], counts: TopicCount[]) {
  return (
    <nav aria-label="In this paper" className={`${ui.card} flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between`}>
      <div className="min-w-0">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">In this paper</h2>
        <FilterNav counts={counts} total={stories.length} />
      </div>
      <div className="lg:w-64 lg:shrink-0">
        <ReadingProgress total={stories.length} />
      </div>
    </nav>
  );
}

function renderRail(rail: ReactNode) {
  if (!rail) {
    return null;
  }
  return (
    <aside className="grid gap-4 border-t border-rule pt-8 md:grid-cols-2" aria-label="Paper tools">
      {rail}
    </aside>
  );
}

export function EditionView({ edition, eyebrow, actions, notices, brief, storyFooter, storyWrapper = keepCard, rail }: EditionViewProps) {
  const counts = topicCounts(edition.stories);
  return (
    <PaperFilterProvider>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={ui.eyebrow}>{eyebrow}</p>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-4xl">{edition.dateLabel}</h1>
            <p className={`${ui.meta} mt-1`}>
              {storyCountLabel(edition.stories.length)} · about {estimatedReadingMinutes(edition.stories)} min (estimate) · {edition.editionLabel}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{actions}</div>
        </header>
        {notices}
        {brief}
        {renderPaperBar(edition.stories, counts)}
        <FilterNotice counts={counts} />
        <RevealList className="space-y-5" label="Stories">
          {edition.stories.map((story, index) => (
            <RevealItem key={story.id}>
              <FilteredStory topics={story.topics}>{storyWrapper(story, <StoryCard story={story} position={index + 1} footer={storyFooter(story)} />)}</FilteredStory>
            </RevealItem>
          ))}
        </RevealList>
        <p className="border-t border-rule pt-6 text-center font-serif text-lg text-muted">You&apos;ve reached the end of today&apos;s paper.</p>
        {renderRail(rail)}
      </div>
    </PaperFilterProvider>
  );
}
