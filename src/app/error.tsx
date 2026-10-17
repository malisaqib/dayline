"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-sm">We couldn&apos;t load this page. Your saved papers are not affected.</p>
      <button onClick={reset} className="mt-6 rounded border border-ink px-4 py-2 text-sm font-medium hover:bg-ink hover:text-paper">
        Try again
      </button>
    </main>
  );
}
