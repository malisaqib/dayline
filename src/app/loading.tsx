const SKELETON_CARDS = [0, 1, 2];

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading your paper</p>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="space-y-6">
          <div className="h-4 w-40 animate-pulse rounded bg-rule" />
          <div className="h-9 w-72 animate-pulse rounded bg-rule" />
          <div className="h-64 animate-pulse rounded-xl bg-rule/60" />
          {SKELETON_CARDS.map((key) => (
            <div key={key} className="h-40 animate-pulse rounded-xl bg-rule/50" />
          ))}
        </div>
        <div className="hidden h-80 animate-pulse rounded-xl bg-rule/50 lg:block" />
      </div>
    </div>
  );
}
