export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-6xl font-bold tracking-wide">Dayline</h1>
      <p className="mt-3 font-serif text-lg italic">Your interests. One morning paper. Five minutes well spent.</p>
      <hr className="my-8 w-full border-rule" />
      <p className="text-sm">Phase 0 setup build. The personalised paper is not available yet.</p>
      <a
        href="/api/pdf/sample"
        className="mt-6 rounded border border-ink px-4 py-2 text-sm font-medium hover:bg-ink hover:text-paper"
      >
        Download sample PDF (placeholder content)
      </a>
    </main>
  );
}
