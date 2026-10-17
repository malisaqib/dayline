import Link from "next/link";
import { ui } from "@/features/shared/ui";
import { readReaderEntry } from "@/server/services/reader-entry";

export const dynamic = "force-dynamic";

function renderSignedIn() {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-8`}>
      <p className={ui.eyebrow}>You&apos;re already reading</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">This browser has your Dayline paper.</h1>
      <p className="mt-3 text-muted">Your topics and papers are linked to this browser.</p>
      <Link href="/today" className={`${ui.primaryButton} mt-6`}>
        Open my paper
      </Link>
    </section>
  );
}

function renderVisitor() {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-8`}>
      <p className={ui.eyebrow}>Sign in</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Start your paper</h1>
      <p className="mt-3 text-muted">
        Email sign-in, so your paper follows you across devices, is not available yet. For now, you can start without an account: your
        topics and papers are saved to this browser only.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/onboarding" className={ui.primaryButton}>
          Continue without an account
        </Link>
        <Link href="/" className={ui.secondaryButton}>
          Back to overview
        </Link>
      </div>
      <p className={`${ui.meta} mt-4`}>Clearing this browser&apos;s data removes access to papers made without an account.</p>
    </section>
  );
}

function renderNeedsTopics() {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-8`}>
      <p className={ui.eyebrow}>Almost there</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Choose your topics to make your first paper.</h1>
      <Link href="/onboarding" className={`${ui.primaryButton} mt-6`}>
        Choose topics
      </Link>
    </section>
  );
}

export default async function SignInPage() {
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    return renderVisitor();
  }
  if (entry.kind === "needs_topics") {
    return renderNeedsTopics();
  }
  return renderSignedIn();
}
