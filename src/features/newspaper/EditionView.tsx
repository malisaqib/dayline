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

function renderIndex(stories: PresentedStory[], counts: TopicCount[]) {
  return (
    <nav aria-label="In this paper" className={`${ui.card} p-5`}>
      <h2 className="font-serif text-lg font-bold">In this paper</h2>
      <div className="mt-3">
        <FilterNav counts={counts} total={stories.length} />
      </div>
      <div className="mt-4 border-t border-rule pt-4">
        <ReadingProgress total={stories.length} />
      </div>
      <ol className="mt-3 hidden lg:block">
        {stories.map((story, index) => (
          <li key={story.id} className="flex gap-3 text-sm">
            <span className="w-5 shrink-0 font-serif font-bold text-accent" aria-hidden="true">
              {index + 1}
            </span>
            <a href={`#story-${index + 1}`} className="line-clamp-2 py-2 hover:text-accent-strong hover:underline">
              {story.headline}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EditionView({ edition, eyebrow, actions, notices, brief, storyFooter, storyWrapper = keepCard, rail }: EditionViewProps) {
  const counts = topicCounts(edition.stories);
  return (
    <PaperFilterProvider>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] xl:gap-8">
        <div className="min-w-0 space-y-4">
          <header className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={ui.eyebrow}>{eyebrow}</p>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight">{edition.dateLabel}</h1>
              <p className={`${ui.meta} mt-1`}>
                {storyCountLabel(edition.stories.length)} · about {estimatedReadingMinutes(edition.stories)} min (estimate) · {edition.editionLabel}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{actions}</div>
          </header>
          {notices}
          <FilterNotice counts={counts} />
          {brief}
          <RevealList className="space-y-4" label="Stories">
            {edition.stories.map((story, index) => (
              <RevealItem key={story.id}>
                <FilteredStory topics={story.topics}>{storyWrapper(story, <StoryCard story={story} position={index + 1} footer={storyFooter(story)} />)}</FilteredStory>
              </RevealItem>
            ))}
          </RevealList>
          <p className="border-t border-rule pt-6 text-center font-serif text-lg text-muted">You&apos;ve reached the end of today&apos;s paper.</p>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start" aria-label="Paper tools">
          {renderIndex(edition.stories, counts)}
          {rail}
        </aside>
      </div>
    </PaperFilterProvider>
  );
}
