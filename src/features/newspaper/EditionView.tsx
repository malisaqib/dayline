import type { ReactNode } from "react";
import type { PresentedEdition, PresentedStory } from "@/domain/editions/presentation";

type StoryFooter = (story: PresentedStory) => ReactNode;

function StoryArticle({ story, lead, footer }: { story: PresentedStory; lead: boolean; footer?: StoryFooter }) {
  return (
    <article className={lead ? "border-b border-rule pb-8" : "break-inside-avoid pb-6"}>
      {story.kicker && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent">{story.kicker}</p>}
      <h2 className={`font-serif font-bold leading-tight ${lead ? "text-3xl sm:text-4xl" : "text-xl"}`}>
        <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {story.headline}
        </a>
      </h2>
      {story.body && <p className={`mt-3 leading-relaxed ${lead ? "text-lg" : "text-[15px]"}`}>{story.body}</p>}
      {story.takeaways.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px]">
          {story.takeaways.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-ink/60">{story.meta}</p>
      <p className="mt-1 text-xs text-ink/60">Why this story: {story.reasons.join("; ")}</p>
      <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
        Read the original at {story.sourceName} &rarr;
      </a>
      {footer?.(story)}
    </article>
  );
}

type EditionViewProps = {
  edition: PresentedEdition;
  /** Null hides the download link (e.g. previews, which are not saved editions). */
  pdfHref: string | null;
  notice?: string;
  storyFooter?: StoryFooter;
  children?: ReactNode;
};

export function EditionView({ edition, pdfHref, notice, storyFooter, children }: EditionViewProps) {
  const [lead, ...rest] = edition.stories;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="text-center">
        <h1 className="font-serif text-5xl font-bold tracking-wider sm:text-6xl">DAYLINE</h1>
        <p className="mt-1 font-serif italic">Your interests. One morning paper. Five minutes well spent.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y-2 border-ink py-2 text-xs">
          <span>{edition.dateLabel}</span>
          <span>{edition.editionLabel}</span>
          <span>{edition.timezone}</span>
        </div>
        <nav className="mt-3 flex justify-center gap-4 text-sm">
          {pdfHref && (
            <a href={pdfHref} className="font-medium text-accent hover:underline">
              Download PDF
            </a>
          )}
          <a href="/archive" className="hover:underline">
            Archive
          </a>
          <a href="/onboarding" className="hover:underline">
            Topics
          </a>
        </nav>
      </header>

      {notice && (
        <p role="note" className="mt-6 rounded border border-accent/40 bg-accent/5 px-4 py-2 text-center text-sm font-medium text-accent">
          {notice}
        </p>
      )}
      <section className="mt-8">
        <StoryArticle story={lead} lead footer={storyFooter} />
      </section>
      <section className="mt-8 gap-8 sm:columns-2">
        {rest.map((story) => (
          <StoryArticle key={story.sourceUrl} story={story} lead={false} footer={storyFooter} />
        ))}
      </section>
      {children}
    </div>
  );
}
