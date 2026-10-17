import type { ReactNode } from "react";
import type { PresentedEdition, PresentedStory } from "@/domain/editions/presentation";
import { RevealItem, RevealList } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
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

function renderIndex(stories: PresentedStory[]) {
  return (
    <nav aria-label="In this paper" className={`${ui.card} hidden p-5 lg:block`}>
      <h2 className="font-serif text-lg font-bold">In this paper</h2>
      <div className="mt-3">
        <ReadingProgress total={stories.length} />
      </div>
      <ol className="mt-4 space-y-2">
        {stories.map((story, index) => (
          <li key={story.id} className="flex gap-3 text-sm">
            <span className="w-5 shrink-0 font-serif font-bold text-accent" aria-hidden="true">
              {index + 1}
            </span>
            <a href={`#story-${index + 1}`} className="line-clamp-2 hover:text-accent-strong hover:underline">
              {story.headline}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EditionView({ edition, eyebrow, actions, notices, brief, storyFooter, storyWrapper = keepCard, rail }: EditionViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-8">
      <div className="min-w-0 space-y-4">
        <header className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={ui.eyebrow}>{eyebrow}</p>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight">{edition.dateLabel}</h1>
            <p className={`${ui.meta} mt-1`}>
              {edition.editionLabel} · {storyCountLabel(edition.stories.length)} · {edition.timezone}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{actions}</div>
        </header>
        {notices}
        {brief}
        <RevealList className="space-y-4" label="Stories">
          {edition.stories.map((story, index) => (
            <RevealItem key={story.id}>{storyWrapper(story, <StoryCard story={story} position={index + 1} footer={storyFooter(story)} />)}</RevealItem>
          ))}
        </RevealList>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Paper tools">
        {renderIndex(edition.stories)}
        {rail}
      </aside>
    </div>
  );
}
