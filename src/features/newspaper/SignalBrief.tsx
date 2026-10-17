import type { BriefStory, SignalBrief as Brief } from "@/domain/editions/signal-brief";
import { ExternalIcon } from "@/features/shared/ExternalIcon";
import { RevealCell, RevealGroup } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
import { ReadingProgress } from "./ReadingProgress";

const PANEL = "rounded-lg border border-rule bg-card p-4";
const PANEL_TITLE = "text-xs font-bold uppercase tracking-[0.12em] text-accent";

function storyLink(item: BriefStory) {
  return (
    <a href={`#story-${item.position}`} className="font-serif text-lg font-bold leading-snug hover:text-accent-strong hover:underline">
      {item.story.headline}
    </a>
  );
}

function renderSentence(sentence: string | null) {
  if (!sentence) {
    return null;
  }
  return <p className="mt-1 line-clamp-3 text-sm">{sentence}</p>;
}

function renderTodayInThree(items: Brief["todayInThree"]) {
  if (items.length === 0) {
    return null;
  }
  return (
    <RevealCell className="sm:col-span-2">
    <section className={`${PANEL} h-full`} aria-labelledby="brief-three">
      <h3 id="brief-three" className={PANEL_TITLE}>
        Today in three
      </h3>
      <ol className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li key={item.story.id} className="flex gap-3 text-[15px]">
            <span className="w-5 shrink-0 font-serif text-lg font-bold leading-6 text-accent" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              {item.sentence}{" "}
              <span className="text-sm text-muted">({item.story.sourceName})</span>{" "}
              <a href={`#story-${item.position}`} className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-semibold text-accent-strong underline-offset-4 hover:underline sm:min-h-0">
                Story {item.position}
              </a>
            </span>
          </li>
        ))}
      </ol>
      <p className={`${ui.meta} mt-2`}>Written by AI from each story&apos;s own headline and text. The source is named and linked on the story.</p>
    </section>
    </RevealCell>
  );
}

function renderTopSignal(top: Brief["topSignal"]) {
  return (
    <section className={`${PANEL} h-full`} aria-labelledby="brief-top">
      <h3 id="brief-top" className={PANEL_TITLE}>
        Top signal
      </h3>
      <div className="mt-2">{storyLink(top)}</div>
      {renderSentence(top.sentence)}
      <p className={`${ui.meta} mt-2`}>
        {top.story.sourceName} · {top.story.publishedLabel}
      </p>
      <a href={top.story.sourceUrl} target="_blank" rel="noopener noreferrer" className={`${ui.secondaryButton} mt-3`}>
        Read the top signal
        <ExternalIcon />
        <span className="sr-only">(opens {top.story.sourceName} in a new tab)</span>
      </a>
    </section>
  );
}

function renderFocus(focus: Brief["focus"]) {
  if (!focus) {
    return null;
  }
  return (
    <RevealCell>
    <section className={`${PANEL} h-full`} aria-labelledby="brief-focus">
      <h3 id="brief-focus" className={PANEL_TITLE}>
        Your focus
      </h3>
      <div className="mt-2">{storyLink(focus)}</div>
      <p className="mt-2 text-sm">{focus.explanation}</p>
      <p className={`${ui.meta} mt-1`}>
        {focus.story.sourceName} · {focus.story.publishedLabel}
      </p>
    </section>
    </RevealCell>
  );
}

function renderPulse(pulse: BriefStory[]) {
  if (pulse.length === 0) {
    return null;
  }
  return (
    <RevealCell className="sm:col-span-2">
    <section className={PANEL} aria-labelledby="brief-pulse">
      <h3 id="brief-pulse" className={PANEL_TITLE}>
        Internet pulse
      </h3>
      <ul className="mt-2 divide-y divide-rule">
        {pulse.map((item) => (
          <li key={item.story.id}>
            <a href={`#story-${item.position}`} className="flex min-h-11 flex-wrap items-baseline gap-x-2 py-2 text-sm hover:text-accent-strong">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{item.story.kicker.split(" · ")[0]}</span>
              <span className="font-semibold hover:underline">{item.story.headline}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
    </RevealCell>
  );
}

export function SignalBrief({ brief, dateLabel }: { brief: Brief; dateLabel: string }) {
  return (
    <section aria-labelledby="signal-brief" className="rounded-card border border-rule border-t-4 border-t-ink bg-paper p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="signal-brief" className="font-serif text-2xl font-bold">
            Signal Brief
          </h2>
          <p className="text-sm font-semibold">Today in five minutes</p>
          <p className={ui.meta}>
            {brief.storyCount} stories · about {brief.readingMinutes} min · {dateLabel}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <ReadingProgress total={brief.storyCount} />
        </div>
      </div>
      <RevealGroup className="mt-4 grid gap-3 sm:grid-cols-2">
        {renderTodayInThree(brief.todayInThree)}
        <RevealCell>{renderTopSignal(brief.topSignal)}</RevealCell>
        {renderFocus(brief.focus)}
        {renderPulse(brief.pulse)}
      </RevealGroup>
    </section>
  );
}
