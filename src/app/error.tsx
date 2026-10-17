"use client";

import Link from "next/link";
import { ui } from "@/features/shared/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-8 text-center`} role="alert">
      <p className={ui.eyebrow}>Something went wrong</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">We couldn&apos;t load this page</h1>
      <p className="mt-3 text-muted">Your saved papers are safe. Try again, or open your archive.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={ui.primaryButton}>
          Try again
        </button>
        <Link href="/archive" className={ui.secondaryButton}>
          Open archive
        </Link>
      </div>
    </section>
  );
}
