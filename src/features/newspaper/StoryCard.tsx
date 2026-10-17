import type { ReactNode } from "react";
import type { PresentedStory } from "@/domain/editions/presentation";
import { ExternalIcon } from "@/features/shared/ExternalIcon";
import { staggerStyle, ui } from "@/features/shared/ui";

type StoryCardProps = { story: PresentedStory; position: number; footer: ReactNode };

const AI_BADGE = "rounded bg-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-paper";
const SOURCE_BADGE = "rounded border border-ink/25 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink";

function badgeClass(story: PresentedStory): string {
  if (story.bodyLabel === "AI summary") {
    return AI_BADGE;
  }
  return SOURCE_BADGE;
}

function renderKicker(story: PresentedStory) {
  if (!story.kicker) {
    return null;
  }
  return <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-accent">{story.kicker}</p>;
}

function renderBody(story: PresentedStory, isLead: boolean) {
  if (!story.body) {
    return <p className="mt-2 text-[15px] text-muted">The publisher only shares the headline. Open the original article to read it.</p>;
  }
  const size = isLead ? "text-[17px]" : "text-[15px]";
  return <p className={`mt-2 leading-relaxed ${size}`}>{story.body}</p>;
}

function renderTakeaways(story: PresentedStory) {
  if (story.takeaways.length === 0) {
    return null;
  }
  return (
    <ul className="mt-3 space-y-1.5 border-l-2 border-accent/40 pl-4 text-[15px]">
      {story.takeaways.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function renderReadingTime(minutes: number | null) {
  if (minutes === null) {
    return null;
  }
  return <span>{minutes} min read</span>;
}

function renderLabel(isLead: boolean, position: number) {
  if (isLead) {
    return <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">Top story</span>;
  }
  return (
    <span className="font-serif text-xl font-bold leading-none text-accent" aria-hidden="true">
      {String(position).padStart(2, "0")}
    </span>
  );
}

export function StoryCard({ story, position, footer }: StoryCardProps) {
  const isLead = position === 1;
  const headlineSize = isLead ? "text-2xl sm:text-3xl" : "text-xl line-clamp-3";
  const padding = isLead ? "p-5 sm:p-8" : "p-4 sm:p-6";
  const accentBorder = isLead ? "border-t-4 border-t-accent" : "";
  return (
    <article id={`story-${position}`} className={`${ui.card} ${padding} ${accentBorder} animate-fade-up scroll-mt-24`} style={staggerStyle(position)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {renderLabel(isLead, position)}
        {story.topicLabels.map((label) => (
          <span key={label} className={ui.chip}>
            {label}
          </span>
        ))}
        <span className={ui.meta}>
          {story.sourceName} · {story.publishedLabel}
        </span>
      </div>
      {renderKicker(story)}
      <h2 className={`mt-3 font-serif font-bold leading-snug ${headlineSize}`}>
        <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent-strong hover:underline">
          {story.headline}
        </a>
      </h2>
      {renderBody(story, isLead)}
      {renderTakeaways(story)}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`${ui.meta} flex flex-wrap items-center gap-3`}>
          <span className={badgeClass(story)}>{story.bodyLabel}</span>
          {renderReadingTime(story.readingMinutes)}
        </div>
        <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer" className={ui.secondaryButton}>
          Read original article
          <ExternalIcon />
          <span className="sr-only">(opens {story.sourceName} in a new tab)</span>
        </a>
      </div>
      <details className="group mt-3 border-t border-rule pt-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className="transition-transform duration-[185ms] group-open:rotate-90">
            ›
          </span>
          Why you&apos;re seeing this
        </summary>
        <p className="pb-1 pl-5 text-sm text-muted">{story.reasons.join(" · ")}</p>
      </details>
      {footer}
    </article>
  );
}
