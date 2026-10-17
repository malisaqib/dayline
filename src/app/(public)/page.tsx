import Link from "next/link";
import { Reveal, RevealCell, RevealGroup } from "@/features/shared/Reveal";
import { Spotlight } from "@/features/shared/Spotlight";
import { ui } from "@/features/shared/ui";

export const dynamic = "force-dynamic";

const BENEFITS = [
  {
    title: "Only what you follow",
    text: "Pick your topics once. Each morning Dayline ranks fresh stories for them and keeps the paper to about six, usually no more than two from any one source.",
  },
  {
    title: "Every story traceable",
    text: "Each story names its publisher and links to the original. Short AI summaries and publisher excerpts are labelled, so you always know what you are reading.",
  },
  {
    title: "Gets better with use",
    text: "More, Less, Skip and the stories you open shape future papers. Today's saved paper never changes underneath you.",
  },
];

const STEPS = [
  { title: "Choose your topics", text: "World, Pakistan, Technology, Science, Space, Cybersecurity or Disaster alerts." },
  { title: "Dayline prepares your paper", text: "Every morning at 06:00 Pakistan time, from trusted feeds and official alerts." },
  { title: "Read it your way", text: "On the web, through the original articles, or as a newspaper-style PDF." },
  { title: "Train it", text: "Tell Dayline what you want more or less of. Past papers stay in your archive." },
];

function renderSamplePreview() {
  return (
    <figure id="sample" className={`${ui.card} scroll-mt-24 p-5`} aria-labelledby="sample-caption">
      <figcaption id="sample-caption" className="flex flex-wrap items-center justify-between gap-2">
        <span className={ui.eyebrow}>Sample layout</span>
        <span className="rounded-full border border-rule px-2.5 py-0.5 text-xs text-muted">Placeholder text, not a real paper</span>
      </figcaption>
      <div className="mt-4 rounded-lg border border-rule bg-paper p-4">
        <p className="font-serif text-lg font-bold">Signal Brief</p>
        <p className={ui.meta}>Today in five minutes · 6 stories</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          <li>1. A one-line takeaway from your first story appears here.</li>
          <li>2. A second takeaway, linked to its story and source.</li>
          <li>3. A third, only when a third story supports one.</li>
        </ol>
      </div>
      <div className="mt-3 rounded-lg border border-rule p-4">
        <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">Top story</span>
        <p className="mt-2 font-serif text-xl font-bold leading-snug">Sample headline for a story on your topic</p>
        <p className="mt-1 text-sm text-muted">Publisher name · published time · AI summary or publisher&apos;s excerpt</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm" aria-hidden="true">
          <span className="rounded-md border border-rule px-3 py-1.5">Read original article ↗</span>
          <span className="rounded-md border border-rule px-3 py-1.5">More like this</span>
          <span className="rounded-md border border-rule px-3 py-1.5">Less like this</span>
        </div>
      </div>
      <a href="/api/pdf/sample" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline-offset-4 hover:underline">
        Download the sample PDF layout
      </a>
    </figure>
  );
}

export default function OverviewPage() {
  return (
    <div className="space-y-16">
      <section className="relative grid items-center gap-10 overflow-hidden lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <Spotlight className="-left-40 -top-40 h-[160%] w-[160%] lg:w-[110%]" />
        <Reveal className="relative py-4">
          <p className={ui.eyebrow}>Dayline</p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">Your interests. One morning paper.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Dayline picks the day&apos;s stories on the topics you follow, gives each one a short source-linked brief, learns from what you read, and
            hands you one finished paper you can read online or download as a PDF.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signin" className={ui.primaryButton}>
              Create my paper
            </Link>
            <a href="#sample" className={ui.secondaryButton}>
              See a sample
            </a>
          </div>
        </Reveal>
        <Reveal className="relative">{renderSamplePreview()}</Reveal>
      </section>

      <section aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="font-serif text-2xl font-bold">
          Why read Dayline
        </h2>
        <RevealGroup className="mt-5 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <RevealCell key={benefit.title} className={`${ui.card} p-5`}>
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted">{benefit.text}</p>
            </RevealCell>
          ))}
        </RevealGroup>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-rule pt-10">
        <h2 id="how-heading" className="font-serif text-2xl font-bold">
          How it works
        </h2>
        <ol className="mt-5 grid gap-5 md:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="w-6 shrink-0 font-serif text-2xl font-bold text-accent" aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-sm text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <Link href="/signin" className={`${ui.primaryButton} mt-8`}>
          Create my paper
        </Link>
      </section>
    </div>
  );
}
