import Link from "next/link";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/domain/auth/return-path";
import { SignInForm } from "@/features/auth/SignInForm";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { ui } from "@/features/shared/ui";
import type { Reader } from "@/server/auth/session";
import { readReaderEntry } from "@/server/services/reader-entry";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const NOTICES: Record<string, string> = {
  expired: "Your session has ended. Sign in with your email to get your topics, papers and archive back.",
  signin: "Sign in to open your paper.",
  link_expired: "That sign-in link has expired or was already used. Request a new code below.",
  signed_out: "You've signed out. Sign in again any time; your topics and papers are kept.",
};

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function pickNotice(params: Record<string, string | string[] | undefined>): string | null {
  const key = first(params.error) ?? (first(params.signed_out) ? "signed_out" : first(params.reason));
  if (!key) {
    return null;
  }
  return NOTICES[key] ?? null;
}

function renderNotice(notice: string | null) {
  if (!notice) {
    return null;
  }
  return (
    <p role="status" className="mt-4 rounded-md border border-rule bg-paper px-3 py-2 text-sm">
      {notice}
    </p>
  );
}

function renderVisitor(next: string, notice: string | null) {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-6 sm:p-8`}>
      <p className={ui.eyebrow}>Sign in</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Your paper, on any device</h1>
      <p className="mt-3 text-muted">Enter your email and we&apos;ll send a one-time code. New here? The same code creates your account.</p>
      {renderNotice(notice)}
      <SignInForm upgrade={false} next={next} />
      <div className="mt-6 border-t border-rule pt-4">
        <p className={ui.meta}>Just looking? You can try Dayline without an account; your paper is then saved to this browser only.</p>
        <Link href="/onboarding" className={`${ui.ghostButton} mt-2 -ml-4`}>
          Try without an account
        </Link>
      </div>
    </section>
  );
}

function renderGuest(next: string, notice: string | null) {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-6 sm:p-8`}>
      <p className={ui.eyebrow}>Keep your paper</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Save this paper to your email</h1>
      <p className="mt-3 text-muted">
        You&apos;re reading as a guest, so your topics, feedback and archive live in this browser only. Add your email to keep them and sign in on
        other devices. Nothing you&apos;ve made so far is lost.
      </p>
      {renderNotice(notice)}
      <SignInForm upgrade next={next} />
      <Link href="/today" className={`${ui.ghostButton} mt-4 -ml-4`}>
        Not now, back to my paper
      </Link>
    </section>
  );
}

function renderSignedIn(account: Reader, hasProfile: boolean) {
  const action = hasProfile ? { href: "/today", label: "Open my paper" } : { href: "/onboarding", label: "Choose my topics" };
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-6 sm:p-8`}>
      <p className={ui.eyebrow}>Signed in</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">You&apos;re signed in.</h1>
      <p className="mt-3 text-muted">
        Signed in as <strong className="text-ink">{account.email}</strong>. Your topics, feedback and archive follow this account on every device.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={action.href} className={ui.primaryButton}>
          {action.label}
        </Link>
        <SignOutButton />
      </div>
    </section>
  );
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeReturnPath(first(params.next));
  const notice = pickNotice(params);
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    return renderVisitor(next ?? "", notice);
  }
  if (entry.account.isAnonymous) {
    return renderGuest(next ?? "", notice);
  }
  if (entry.kind === "reader" && next) {
    redirect(next);
  }
  if (entry.kind === "needs_topics") {
    return renderSignedIn(entry.account, false);
  }
  return renderSignedIn(entry.account, true);
}
