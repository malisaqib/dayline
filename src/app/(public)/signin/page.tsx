import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { safeReturnPath } from "@/domain/auth/return-path";
import { PasswordForm } from "@/features/auth/PasswordForm";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { InView, Reveal } from "@/features/shared/Reveal";
import { ui } from "@/features/shared/ui";
import { PageMain } from "@/features/shell/PageMain";
import type { Reader } from "@/server/auth/session";
import { readReaderEntry } from "@/server/services/reader-entry";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const NOTICES: Record<string, string> = {
  expired: "Your session has ended. Sign in to get your topics, papers and archive back.",
  signin: "Sign in to open your paper.",
  link_expired: "That sign-in link has expired or was already used. Try again below.",
  signed_out: "You've signed out. Sign in again any time; your topics and papers are kept.",
};

const VISITOR_TITLE = { signin: "Welcome back", create: "Create your paper" } as const;

const VISITOR_TEXT = {
  signin: "Sign in to open your paper, archive and saved topics on any device.",
  create: "Create a free account. Next you'll choose what you follow, then your first paper is made.",
} as const;

const JOURNEY = [
  { title: "Sign in", text: "Just your email and a password." },
  { title: "Choose what you follow", text: "Pick topics and add your own interests, like AI agents." },
  { title: "Read your paper", text: "Your first paper is made right away: summarised, source-linked, and ready as a PDF." },
];

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
    <p role="status" className="mt-4 rounded-xl border border-rule bg-paper px-3 py-2 text-sm">
      {notice}
    </p>
  );
}

function renderJourney() {
  return (
    <InView from="right" className="relative hidden lg:block">
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_120px_-40px_rgb(240_138_114/0.45)]">
        <Image src="/overview/edition.webp" alt="A real Dayline paper with its Signal Brief and stories" width={1140} height={820} className="h-auto w-full" />
      </div>
      <ol className="mt-8 space-y-5">
        {JOURNEY.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-accent/50 font-serif text-lg font-bold text-accent">{index + 1}</span>
            <span>
              <span className="block font-semibold">{step.title}</span>
              <span className="block text-sm text-muted">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </InView>
  );
}

function renderShell(card: ReactNode) {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <Reveal className={`${ui.card} p-6 sm:p-8`}>{card}</Reveal>
      {renderJourney()}
    </div>
  );
}

function renderVisitor(next: string, notice: string | null, creating: boolean) {
  const intent = creating ? "create" : "signin";
  return renderShell(
    <>
      <p className={ui.eyebrow}>Step 1 of 3 · Sign in</p>
      <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">{VISITOR_TITLE[intent]}</h1>
      <p className="mt-3 text-muted">{VISITOR_TEXT[intent]}</p>
      {renderNotice(notice)}
      <PasswordForm next={next} initialIntent={intent} />
      <div className="mt-6 border-t border-rule pt-4">
        <p className={ui.meta}>Just looking? Try Dayline without an account; your paper is then saved to this browser only.</p>
        <Link href="/onboarding" className={`${ui.ghostButton} mt-2 -ml-4`}>
          Try without an account →
        </Link>
      </div>
    </>,
  );
}

function renderGuest(next: string, notice: string | null) {
  return renderShell(
    <>
      <p className={ui.eyebrow}>Keep your paper</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Save this paper to your account</h1>
      <p className="mt-3 text-muted">
        You&apos;re reading as a guest, so your topics, feedback and archive live in this browser only. Add an email and password to keep them and sign in on other
        devices. Nothing you&apos;ve made so far is lost.
      </p>
      {renderNotice(notice)}
      <PasswordForm next={next} initialIntent="upgrade" />
      <Link href="/today" className={`${ui.ghostButton} mt-4 -ml-4`}>
        Not now, back to my paper
      </Link>
    </>,
  );
}

function renderSignedIn(account: Reader, hasProfile: boolean) {
  const action = hasProfile ? { href: "/today", label: "Open my paper" } : { href: "/onboarding", label: "Choose my topics" };
  return renderShell(
    <>
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
    </>,
  );
}

async function renderSignIn({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeReturnPath(first(params.next));
  const notice = pickNotice(params);
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    return renderVisitor(next ?? "", notice, first(params.mode) === "create");
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

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return <PageMain>{await renderSignIn({ searchParams })}</PageMain>;
}
