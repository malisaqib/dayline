import Link from "next/link";
import { describeWeight, type TopicWeights } from "@/domain/personalization/weights";
import { topicLabel, type TopicId } from "@/domain/topics";
import { TodayForm } from "@/features/newspaper/TodayForm";
import { WHAT_YOU_GET } from "@/features/onboarding/topic-copy";
import { ui } from "@/features/shared/ui";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findProfile, type Profile } from "@/server/repositories/profiles";

export const dynamic = "force-dynamic";

const LEVEL_TEXT = { more: "More", standard: "Standard", less: "Less" } as const;

function renderWhatYouGet() {
  return (
    <ul className="mt-4 space-y-3 text-[15px]">
      {WHAT_YOU_GET.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="text-accent">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function renderTopicChips(topics: TopicId[], weights: TopicWeights) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {topics.map((topic) => (
        <li key={topic} className={ui.chip}>
          {topicLabel(topic)} · {LEVEL_TEXT[describeWeight(weights[topic] ?? 1)]}
        </li>
      ))}
    </ul>
  );
}

function renderNewReader() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <section className="animate-fade-up py-4">
        <p className={ui.eyebrow}>Your personal morning paper</p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">Five minutes. Everything you care about.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Dayline gathers today&apos;s stories on your topics from trusted sources and official alerts, ranks them for you, and hands you one finished paper.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/onboarding" className={ui.primaryButton}>
            Get started
          </Link>
          <p className={ui.meta}>No sign-up. Takes about ten seconds.</p>
        </div>
      </section>
      <aside className={`${ui.card} animate-fade-up p-6`} style={{ animationDelay: "60ms" }} aria-labelledby="inside-heading">
        <h2 id="inside-heading" className="font-serif text-xl font-bold">
          Every morning at 06:00
        </h2>
        {renderWhatYouGet()}
      </aside>
    </div>
  );
}

function renderReturningReader(profile: Profile) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <section className={`${ui.card} animate-fade-up p-6 sm:p-8`}>
        <p className={ui.eyebrow}>Good morning</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">Your paper is ready to read.</h1>
        <p className="mt-3 text-muted">Up to six stories picked for your topics, saved for today and downloadable as a PDF.</p>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <TodayForm />
          <Link href="/archive" className={ui.secondaryButton}>
            Past papers
          </Link>
        </div>
      </section>
      <aside className={`${ui.card} animate-fade-up p-6`} style={{ animationDelay: "60ms" }} aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="font-serif text-xl font-bold">
          Your paper covers
        </h2>
        {renderTopicChips(profile.topics, profile.weights)}
        <p className={`${ui.meta} mt-4`}>Your More and Less choices adjust how often each topic appears. New papers arrive at 06:00 Pakistan time.</p>
        <Link href="/onboarding" className={`${ui.ghostButton} -ml-4 mt-2`}>
          Edit topics
        </Link>
      </aside>
    </div>
  );
}

export default async function HomePage() {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const profile = reader ? await findProfile(db, reader.id) : null;
  if (!profile) {
    return renderNewReader();
  }
  return renderReturningReader(profile);
}
