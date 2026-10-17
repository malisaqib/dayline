import Link from "next/link";
import { redirect } from "next/navigation";
import type { Edition } from "@/domain/editions/edition";
import { estimatedReadingMinutes, presentEdition, type PresentedStory } from "@/domain/editions/presentation";
import { describeWeight, WEIGHT_POLICY } from "@/domain/personalization/weights";
import { topicLabel } from "@/domain/topics";
import { TopicIcon } from "@/features/onboarding/TopicIcon";
import { NextPaperCountdown } from "@/features/newspaper/NextPaperCountdown";
import { TodayForm } from "@/features/newspaper/TodayForm";
import { InView, Reveal, RevealCell, RevealGroup } from "@/features/shared/Reveal";
import { SpotlightCard } from "@/features/shared/SpotlightCard";
import { ui } from "@/features/shared/ui";
import type { Profile } from "@/server/repositories/profiles";
import { readReaderEntry } from "@/server/services/reader-entry";

export const dynamic = "force-dynamic";

const LEVEL_TEXT = { more: "More", standard: "Standard", less: "Less" } as const;

const BEFORE_STEPS = [
  { title: "Gather", text: "Fresh stories from the sources behind your topics." },
  { title: "Rank", text: "Your topics, interests and feedback decide the order." },
  { title: "Brief", text: "Short, labelled summaries that link to the originals." },
  { title: "Save", text: "One paper for today, kept in your archive." },
];

function renderGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgb(240_138_114/0.18),transparent_60%)]"
    />
  );
}

function renderReady(edition: Edition) {
  const presented = presentEdition(edition);
  const stories = presented.stories;
  const minutes = estimatedReadingMinutes(stories);
  return (
    <div>
      {renderGlow()}
      <p className={`${ui.eyebrow} relative`}>Today&apos;s paper · {presented.dateLabel}</p>
      <h1 className="relative mt-3 font-serif text-3xl font-bold leading-tight sm:text-5xl">Today&apos;s paper is ready.</h1>
      <p className="relative mt-3 text-muted">
        {stories.length} stories · about {minutes} min to read (estimate) · saved for today and will not change.
      </p>
      {renderTodayInThree(edition, stories)}
      <div className="relative mt-7 flex flex-wrap gap-3">
        <Link href={`/edition/${edition.id}`} className={ui.primaryButton}>
          Open today&apos;s paper <span aria-hidden="true">→</span>
        </Link>
        <a href={`/api/editions/${edition.id}/pdf`} className={ui.secondaryButton}>
          Download PDF
        </a>
      </div>
    </div>
  );
}

function renderTodayInThree(edition: Edition, stories: PresentedStory[]) {
  if (edition.todayInThree.length === 0) {
    return null;
  }
  return (
    <ol className="relative mt-6 space-y-3 border-t border-rule pt-5" aria-label="Today in three">
      {edition.todayInThree.map((item, index) => (
        <li key={item.articleHash} className="flex gap-4">
          <span className="font-serif text-2xl font-bold leading-none text-accent" aria-hidden="true">
            {index + 1}
          </span>
          <span className="text-base leading-relaxed">
            {item.sentence} <span className="text-muted">({sourceOf(stories, item.articleHash)})</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function sourceOf(stories: PresentedStory[], articleHash: string): string {
  const story = stories.find((s) => s.id === articleHash);
  if (!story) {
    return "source in the paper";
  }
  return story.sourceName;
}

function renderNotReady() {
  return (
    <div>
      {renderGlow()}
      <p className={`${ui.eyebrow} relative`}>Today&apos;s paper</p>
      <h1 className="relative mt-3 font-serif text-3xl font-bold leading-tight sm:text-5xl">Today&apos;s paper hasn&apos;t been made yet.</h1>
      <p className="relative mt-3 text-muted">
        Papers are prepared automatically at 06:00 Pakistan time. You can create today&apos;s now; it is saved once and stays the same all day.
      </p>
      <ol className="relative mt-6 grid gap-3 border-t border-rule pt-5 sm:grid-cols-2">
        {BEFORE_STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="font-serif text-2xl font-bold leading-none text-accent" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              <span className="block font-semibold">{step.title}</span>
              <span className="block text-sm text-muted">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="relative mt-7 flex flex-wrap items-start gap-3">
        <TodayForm label="Create today's paper" />
        <Link href="/archive" className={ui.secondaryButton}>
          Past papers
        </Link>
      </div>
    </div>
  );
}

function renderHeadlines(edition: Edition | null) {
  if (!edition) {
    return null;
  }
  const stories = presentEdition(edition).stories;
  return (
    <section aria-labelledby="headlines-heading" className="mt-12">
      <InView className="flex items-end justify-between gap-4">
        <h2 id="headlines-heading" className="font-serif text-2xl font-bold sm:text-3xl">
          In today&apos;s paper
        </h2>
        <Link href="/archive" className={ui.ghostButton}>
          Past papers →
        </Link>
      </InView>
      <RevealGroup className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, index) => (
          <RevealCell key={story.id} className="h-full">
            <SpotlightCard className="h-full rounded-card">
              <Link
                href={`/edition/${edition.id}#story-${index + 1}`}
                className={`${ui.card} group flex h-full flex-col p-5 transition-[transform,border-color] duration-[300ms] hover:-translate-y-1 hover:border-accent/40`}
              >
                <span className="flex items-center gap-2 text-xs text-muted">
                  <TopicIcon topic={story.topics[0] ?? "world"} className="size-4 text-accent" />
                  {story.topicLabels.join(" · ")}
                </span>
                <span className="mt-3 font-serif text-lg font-bold leading-snug group-hover:text-accent-strong">{story.headline}</span>
                <span className="mt-auto pt-4 text-sm text-muted">
                  {story.sourceName} · {story.publishedLabel}
                </span>
              </Link>
            </SpotlightCard>
          </RevealCell>
        ))}
      </RevealGroup>
    </section>
  );
}

function renderTopics(profile: Profile) {
  return (
    <aside className={`${ui.card} p-6`} aria-labelledby="topics-heading">
      <h2 id="topics-heading" className="font-serif text-xl font-bold">
        Your paper covers
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {profile.topics.map((topic) => (
          <li key={topic} className={ui.chip}>
            <TopicIcon topic={topic} className="size-3.5 text-accent" />
            {topicLabel(topic)} · {LEVEL_TEXT[describeWeight(profile.weights[topic] ?? WEIGHT_POLICY.baseline)]}
          </li>
        ))}
        {profile.interests.map((interest) => (
          <li key={interest} className={`${ui.chip} border-accent/40`}>
            “{interest}”
          </li>
        ))}
      </ul>
      <p className={`${ui.meta} mt-4`}>More, Less and Skip on any story adjust how often each topic appears in future papers.</p>
      <Link href="/onboarding" className={`${ui.ghostButton} -ml-4 mt-2`}>
        Edit topics and interests
      </Link>
    </aside>
  );
}

function renderCountdown() {
  return (
    <aside className={`${ui.card} relative overflow-hidden p-6`} aria-labelledby="next-heading">
      {renderGlow()}
      <h2 id="next-heading" className="relative text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        Next paper in
      </h2>
      <div className="relative mt-2">
        <NextPaperCountdown />
      </div>
      <p className={`${ui.meta} relative mt-2`}>Prepared automatically at 06:00 Pakistan time with your latest topics and feedback.</p>
    </aside>
  );
}

function renderMain(edition: Edition | null) {
  if (edition) {
    return renderReady(edition);
  }
  return renderNotReady();
}

export default async function TodayPage() {
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    redirect("/signin");
  }
  if (entry.kind === "needs_topics") {
    redirect("/onboarding");
  }
  return (
    <div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-8">
        <Reveal className={`${ui.card} relative overflow-hidden p-6 sm:p-8`}>{renderMain(entry.todayEdition)}</Reveal>
        <div className="grid gap-6">
          <Reveal>{renderCountdown()}</Reveal>
          <Reveal>{renderTopics(entry.profile)}</Reveal>
        </div>
      </div>
      {renderHeadlines(entry.todayEdition)}
    </div>
  );
}
