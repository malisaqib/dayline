import type { PresentedEdition, PresentedStory } from "@/domain/editions/presentation";

function StoryArticle({ story, lead }: { story: PresentedStory; lead: boolean }) {
  return (
    <article className={lead ? "border-b border-rule pb-8" : "break-inside-avoid pb-6"}>
      <h2 className={`font-serif font-bold leading-tight ${lead ? "text-3xl sm:text-4xl" : "text-xl"}`}>
        <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {story.headline}
        </a>
      </h2>
      {story.body && <p className={`mt-3 leading-relaxed ${lead ? "text-lg" : "text-[15px]"}`}>{story.body}</p>}
      <p className="mt-2 text-xs text-ink/60">{story.meta}</p>
      <p className="mt-1 text-xs text-ink/60">Why this story: {story.reasons.join("; ")}</p>
      <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
        Read the original at {story.sourceName} &rarr;
      </a>
    </article>
  );
}

export function EditionView({ edition, pdfHref }: { edition: PresentedEdition; pdfHref: string }) {
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
          <a href={pdfHref} className="font-medium text-accent hover:underline">
            Download PDF
          </a>
          <a href="/archive" className="hover:underline">
            Archive
          </a>
          <a href="/onboarding" className="hover:underline">
            Topics
          </a>
        </nav>
      </header>

      <section className="mt-8">
        <StoryArticle story={lead} lead />
      </section>
      <section className="mt-8 gap-8 sm:columns-2">
        {rest.map((story) => (
          <StoryArticle key={story.sourceUrl} story={story} lead={false} />
        ))}
      </section>
    </div>
  );
}
