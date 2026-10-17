import Link from "next/link";
import type { EditionSummary } from "@/domain/editions/edition";
import { formatEditionDate } from "@/domain/editions/edition";
import { topicIdSchema, topicLabel } from "@/domain/topics";
import { TodayForm } from "@/features/newspaper/TodayForm";
import { RevealItem, RevealList } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { listEditions } from "@/server/repositories/editions";

export const dynamic = "force-dynamic";

function topicNames(topics: string[]): string[] {
  return topics.flatMap((topic) => {
    const parsed = topicIdSchema.safeParse(topic);
    if (!parsed.success) {
      return [];
    }
    return [topicLabel(parsed.data)];
  });
}

function renderCard(edition: EditionSummary) {
  return (
    <RevealItem key={edition.id} className={`${ui.card} flex flex-col p-5 sm:only:col-span-2`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-xl font-bold leading-snug">{formatEditionDate(edition.localDate)}</h2>
        <span className="shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-paper">Saved</span>
      </div>
      <p className={`${ui.meta} mt-1`}>{edition.storyCount} stories</p>
      <p className="mt-3 line-clamp-2 text-[15px]">
        <span className="font-semibold">Top story: </span>
        {edition.leadTitle}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Topics">
        {topicNames(edition.topics).map((name) => (
          <li key={name} className={ui.chip}>
            {name}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={`/edition/${edition.id}`} className={ui.secondaryButton}>
          Open paper
        </Link>
        <a href={`/api/editions/${edition.id}/pdf`} className={ui.ghostButton}>
          Download PDF
        </a>
      </div>
    </RevealItem>
  );
}

function renderEmpty() {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-8 text-center`}>
      <p className={ui.eyebrow}>No saved papers yet</p>
      <h2 className="mt-3 font-serif text-2xl font-bold">Your archive starts with your first paper</h2>
      <p className="mt-3 text-muted">Choose your topics and Dayline will build today&apos;s paper. Every paper is saved here.</p>
      <Link href="/onboarding" className={`${ui.primaryButton} mt-6`}>
        Choose your topics
      </Link>
    </section>
  );
}

function renderSummary(editions: EditionSummary[]) {
  const stories = editions.reduce((total, edition) => total + edition.storyCount, 0);
  const topics = topicNames([...new Set(editions.flatMap((edition) => edition.topics))]);
  const stats = [
    { label: "Papers saved", value: String(editions.length) },
    { label: "Stories collected", value: String(stories) },
    { label: "Next paper", value: "06:00 PKT" },
  ];
  return (
    <aside className={`${ui.card} p-5 lg:sticky lg:top-20 lg:self-start`} aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="font-serif text-lg font-bold">
        Your reading so far
      </h2>
      <dl className="mt-4 grid grid-cols-3 gap-3 lg:grid-cols-1">
        {stats.map((stat) => (
          <div key={stat.label} className="border-l-2 border-accent pl-3">
            <dt className={ui.meta}>{stat.label}</dt>
            <dd className="font-serif text-2xl font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className={`${ui.meta} mt-4`}>Topics covered</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {topics.map((name) => (
          <li key={name} className={ui.chip}>
            {name}
          </li>
        ))}
      </ul>
      <Link href="/onboarding" className={`${ui.secondaryButton} mt-5 w-full`}>
        Edit topics
      </Link>
    </aside>
  );
}

function renderBody(editions: EditionSummary[]) {
  if (editions.length === 0) {
    return renderEmpty();
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-8">
      <RevealList className="grid content-start gap-4 sm:grid-cols-2" label="Saved papers">
        {editions.map(renderCard)}
      </RevealList>
      {renderSummary(editions)}
    </div>
  );
}

function renderTodayAction(hasPapers: boolean) {
  if (!hasPapers) {
    return null;
  }
  return <TodayForm />;
}

export default async function ArchivePage() {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const editions = reader ? await listEditions(db) : [];
  const hasPapers = editions.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>Archive</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">Your past papers</h1>
          <p className={`${ui.meta} mt-1`}>Every paper is saved exactly as it was published.</p>
        </div>
        {renderTodayAction(hasPapers)}
      </header>
      {renderBody(editions)}
    </div>
  );
}
