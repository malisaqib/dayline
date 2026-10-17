const bar = "block rounded-full bg-white/10";

function Line({ width, className = "h-2" }: { width: string; className?: string }) {
  return <span className={`${bar} ${className}`} style={{ width }} />;
}

export function EditionMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-card shadow-[0_40px_120px_-40px_rgb(240_138_114/0.45)]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 hidden rounded-md bg-white/5 px-3 py-1 text-[11px] text-night-muted sm:block">dayline / today&apos;s paper</span>
      </div>
      <div className="grid gap-4 p-4 text-left sm:p-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="rounded-xl border border-white/10 bg-night p-4">
          <p className="font-serif text-lg font-bold text-white">Signal Brief</p>
          <p className="text-xs text-night-muted">Today in five minutes · 6 stories</p>
          <ol className="mt-4 space-y-3 text-[13px] text-white/80">
            <li className="flex gap-2">
              <span className="font-serif text-glow">1</span>A one-line takeaway from your first story.
            </li>
            <li className="flex gap-2">
              <span className="font-serif text-glow">2</span>A second takeaway, linked to its source.
            </li>
            <li className="flex gap-2">
              <span className="font-serif text-glow">3</span>A third, only when a story supports it.
            </li>
          </ol>
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4" aria-hidden="true">
            <Line width="70%" />
            <Line width="45%" />
          </div>
        </div>
        <div className="space-y-3">
          <article className="rounded-xl border border-white/10 bg-night p-4">
            <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-night">Top story</span>
            <p className="mt-2 font-serif text-xl font-bold leading-snug text-white">Sample headline for a story on your topic</p>
            <p className="mt-1 text-xs text-night-muted">Publisher · published time · AI summary</p>
            <div className="mt-3 space-y-2" aria-hidden="true">
              <Line width="100%" />
              <Line width="88%" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/80" aria-hidden="true">
              <span className="rounded-md border border-white/15 px-2.5 py-1">Read original ↗</span>
              <span className="rounded-md border border-white/15 px-2.5 py-1">More like this</span>
              <span className="rounded-md border border-white/15 px-2.5 py-1">Less like this</span>
            </div>
          </article>
          <article className="rounded-xl border border-white/10 bg-night p-4" aria-hidden="true">
            <Line width="60%" className="h-3" />
            <div className="mt-3 space-y-2">
              <Line width="95%" />
              <Line width="72%" />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export function PdfMockup() {
  return (
    <div className="mx-auto w-full max-w-xs rotate-[-2deg] rounded-md bg-[#fbf8f1] p-5 text-[#1d2433] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">
      <p className="border-b-2 border-[#1d2433] pb-1 text-center font-serif text-2xl font-bold">Dayline</p>
      <p className="mt-1 text-center text-[9px] uppercase tracking-[0.2em] text-[#566074]">Your morning paper · PDF</p>
      <p className="mt-4 font-serif text-base font-bold leading-tight">Sample headline set in newspaper type</p>
      <div className="mt-3 grid grid-cols-2 gap-3" aria-hidden="true">
        <div className="space-y-1.5">
          <span className="block h-1.5 rounded bg-[#1d2433]/15" />
          <span className="block h-1.5 rounded bg-[#1d2433]/15" />
          <span className="block h-1.5 w-3/4 rounded bg-[#1d2433]/15" />
          <span className="block h-1.5 rounded bg-[#1d2433]/15" />
        </div>
        <div className="space-y-1.5">
          <span className="block h-1.5 rounded bg-[#1d2433]/15" />
          <span className="block h-1.5 w-2/3 rounded bg-[#1d2433]/15" />
          <span className="block h-1.5 rounded bg-[#1d2433]/15" />
          <span className="block h-1.5 rounded bg-[#1d2433]/15" />
        </div>
      </div>
      <p className="mt-4 border-t border-[#1d2433]/20 pt-2 text-[9px] text-[#566074]">Every story links to its publisher.</p>
    </div>
  );
}

export function LearningMockup() {
  const rows = [
    { label: "Space", width: "82%", note: "More often" },
    { label: "Technology", width: "60%", note: "As chosen" },
    { label: "World", width: "34%", note: "Less often" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-night-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-glow">Your paper is learning</p>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-sm text-white">
              <span>{row.label}</span>
              <span className="text-night-muted">{row.note}</span>
            </div>
            <span className="mt-2 block h-1.5 rounded-full bg-white/10">
              <span className="block h-1.5 rounded-full bg-glow" style={{ width: row.width }} />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/80" aria-hidden="true">
        <span className="rounded-full border border-white/15 px-3 py-1">More like this</span>
        <span className="rounded-full border border-white/15 px-3 py-1">Less like this</span>
        <span className="rounded-full border border-white/15 px-3 py-1">Skip</span>
      </div>
      <p className="mt-4 text-[11px] text-night-muted">Illustration. Your own weights appear in your paper.</p>
    </div>
  );
}

export function SourceMockup() {
  return (
    <div className="rounded-2xl border border-white/10 bg-night-card p-5">
      <p className="text-xs text-night-muted">Example story card</p>
      <p className="mt-2 font-serif text-xl font-bold leading-snug text-white">Sample headline for a story on your topic</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-night-muted">Publisher</dt>
        <dd className="text-white">Named on every story</dd>
        <dt className="text-night-muted">Summary</dt>
        <dd className="text-white">Labelled AI summary or publisher excerpt</dd>
        <dt className="text-night-muted">Original</dt>
        <dd className="text-glow">Read original article ↗</dd>
      </dl>
    </div>
  );
}

export function BriefMockup() {
  const items = ["The takeaway from your top story, in one line.", "A second takeaway, linked to its story.", "A third, only when a story supports it."];
  return (
    <div className="rounded-2xl border border-white/10 bg-night-card p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-2xl font-bold text-white">Today in three</p>
        <p className="text-xs text-night-muted">Example</p>
      </div>
      <ol className="mt-5 space-y-4">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4 border-t border-white/10 pt-4">
            <span className="font-serif text-2xl font-bold text-glow">{index + 1}</span>
            <span>
              <span className="block text-white">{item}</span>
              <span className="mt-1 block text-xs text-night-muted">Publisher name · source linked</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
