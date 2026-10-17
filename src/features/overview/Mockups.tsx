export function LearningMockup() {
  const rows = [
    { label: "Space", width: "82%", note: "More often" },
    { label: "Technology", width: "60%", note: "As chosen" },
    { label: "World", width: "34%", note: "Less often" },
  ];
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-glow">Your paper is learning</p>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-sm text-ink">
              <span>{row.label}</span>
              <span className="text-muted">{row.note}</span>
            </div>
            <span className="mt-2 block h-1.5 rounded-full bg-ink/10">
              <span className="block h-1.5 rounded-full bg-glow" style={{ width: row.width }} />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink/80" aria-hidden="true">
        <span className="rounded-full border border-ink/15 px-3 py-1">More like this</span>
        <span className="rounded-full border border-ink/15 px-3 py-1">Less like this</span>
        <span className="rounded-full border border-ink/15 px-3 py-1">Skip</span>
      </div>
      <p className="mt-4 text-xs text-muted">Illustration. Your own weights appear in your paper.</p>
    </div>
  );
}

export function SourceMockup() {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="text-xs text-muted">Example story card</p>
      <p className="mt-2 font-serif text-xl font-bold leading-snug text-ink">Sample headline for a story on your topic</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">Publisher</dt>
        <dd className="text-ink">Named on every story</dd>
        <dt className="text-muted">Summary</dt>
        <dd className="text-ink">Labelled AI summary or publisher excerpt</dd>
        <dt className="text-muted">Original</dt>
        <dd className="text-glow">Read original article ↗</dd>
      </dl>
    </div>
  );
}

export function BriefMockup() {
  const items = ["The takeaway from your top story, in one line.", "A second takeaway, linked to its story.", "A third, only when a story supports it."];
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-2xl font-bold text-ink">Today in three</p>
        <p className="text-xs text-muted">Example</p>
      </div>
      <ol className="mt-5 space-y-4">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4 border-t border-ink/10 pt-4">
            <span className="font-serif text-2xl font-bold text-glow">{index + 1}</span>
            <span>
              <span className="block text-ink">{item}</span>
              <span className="mt-1 block text-xs text-muted">Publisher name · source linked</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
