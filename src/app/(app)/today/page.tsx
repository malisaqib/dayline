import Link from "next/link";
import { redirect } from "next/navigation";
import { describeWeight, WEIGHT_POLICY } from "@/domain/personalization/weights";
import { topicLabel } from "@/domain/topics";
import { TodayForm } from "@/features/newspaper/TodayForm";
import { Reveal } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
import type { Profile } from "@/server/repositories/profiles";
import { readReaderEntry } from "@/server/services/reader-entry";

export const dynamic = "force-dynamic";

const LEVEL_TEXT = { more: "More", standard: "Standard", less: "Less" } as const;

function renderTodayCard(todayEditionId: string | null) {
  if (todayEditionId) {
    return (
      <>
        <p className={ui.eyebrow}>Today&apos;s paper</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">Today&apos;s paper is ready.</h1>
        <p className="mt-3 text-muted">It is saved for today and will not change. You can read it here or download it as a PDF.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/edition/${todayEditionId}`} className={ui.primaryButton}>
            Open today&apos;s paper
          </Link>
          <Link href="/archive" className={ui.secondaryButton}>
            Past papers
          </Link>
        </div>
      </>
    );
  }
  return (
    <>
      <p className={ui.eyebrow}>Today&apos;s paper</p>
      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">Today&apos;s paper hasn&apos;t been made yet.</h1>
      <p className="mt-3 text-muted">
        Papers are prepared automatically at 06:00 Pakistan time. You can create today&apos;s now; it is saved once and stays the same all day.
      </p>
      <div className="mt-6 flex flex-wrap items-start gap-3">
        <TodayForm label="Create today's paper" />
        <Link href="/archive" className={ui.secondaryButton}>
          Past papers
        </Link>
      </div>
    </>
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
            {topicLabel(topic)} · {LEVEL_TEXT[describeWeight(profile.weights[topic] ?? WEIGHT_POLICY.baseline)]}
          </li>
        ))}
      </ul>
      <p className={`${ui.meta} mt-4`}>More, Less and Skip on any story adjust how often each topic appears in future papers.</p>
      <Link href="/onboarding" className={`${ui.ghostButton} -ml-4 mt-2`}>
        Edit topics
      </Link>
    </aside>
  );
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <Reveal className={`${ui.card} p-6 sm:p-8`}>{renderTodayCard(entry.todayEditionId)}</Reveal>
      <Reveal>{renderTopics(entry.profile)}</Reveal>
    </div>
  );
}
