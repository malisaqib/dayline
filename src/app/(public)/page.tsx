import Link from "next/link";
import type { ReactNode } from "react";
import { TopicIcon } from "@/features/onboarding/TopicIcon";
import { BriefMockup, LearningMockup, SourceMockup } from "@/features/overview/Mockups";
import { PdfShot, ProductShot } from "@/features/overview/ProductShot";
import { RotatingWord } from "@/features/overview/RotatingWord";
import { InView, Reveal, RevealCell, RevealGroup } from "@/features/shared/Reveal";

export const dynamic = "force-dynamic";

const pill = "inline-flex min-h-12 items-center justify-center rounded-full bg-glow px-7 text-base font-semibold text-on-accent transition-colors duration-[185ms] hover:brightness-110";
const ghostPill = "inline-flex min-h-12 items-center justify-center rounded-full border border-ink/20 px-6 text-base font-semibold text-ink transition-colors duration-[185ms] hover:border-ink/60";

const ROTATING = ["your topics", "Pakistan", "cybersecurity", "space", "the world"];

const SOURCES = [
  { topic: "world", title: "World", text: "International coverage from BBC News and NPR, plus official GDACS alerts when they matter." },
  { topic: "pakistan", title: "Pakistan", text: "National news from Dawn and Geo News." },
  { topic: "technology", title: "Technology", text: "Ars Technica, plus what Hacker News is discussing that morning." },
  { topic: "science", title: "Science", text: "New research from ScienceDaily and NASA, summarised in plain language." },
  { topic: "space", title: "Space", text: "Missions, launches and discoveries straight from NASA." },
  { topic: "security", title: "Cybersecurity", text: "CISA's list of vulnerabilities attackers are actively exploiting." },
  { topic: "disasters", title: "Disaster alerts", text: "Earthquakes, floods and cyclones from the GDACS alert system." },
];

const SECTIONS: { eyebrow: string; title: string; text: string; visual: ReactNode }[] = [
  {
    eyebrow: "Signal Brief",
    title: "Know the day before the headlines",
    text: "Every paper opens with a brief: the three takeaways worth your time, each linked to the story and the source it came from. Read it in under a minute, then go deeper only where you want.",
    visual: <BriefMockup />,
  },
  {
    eyebrow: "Traceable",
    title: "Every story leads back to its source",
    text: "Dayline names the publisher on every story and links to the original article. Short AI summaries and publisher excerpts are clearly labelled, so you always know what you are reading.",
    visual: <SourceMockup />,
  },
  {
    eyebrow: "Learns with you",
    title: "A paper that gets better every morning",
    text: "Tap More or Less, skip what you don't want, and open what interests you. Tomorrow's paper adjusts. Papers you've already received never change underneath you.",
    visual: <LearningMockup />,
  },
  {
    eyebrow: "Web and PDF",
    title: "Read it online, or keep it as a newspaper",
    text: "The same paper is available as a newspaper-style PDF to download, print or read offline. Every past paper waits in your archive.",
    visual: <PdfShot />,
  },
];

const STEPS = [
  { title: "Choose your topics", text: "Pick up to three. It takes about ten seconds." },
  { title: "Dayline prepares your paper", text: "Every morning at 06:00 Pakistan time." },
  { title: "Read it your way", text: "On the web, through the originals, or as a PDF." },
  { title: "Steer it", text: "More, Less and Skip shape tomorrow's paper." },
];

function renderHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_100%,var(--glow-warm),transparent_60%),radial-gradient(ellipse_70%_60%_at_15%_20%,var(--glow-cool),transparent_60%)]"
      />
      <Reveal className="relative mx-auto max-w-4xl text-center">
        <h1 className="font-serif text-4xl font-bold leading-[1.1] text-ink sm:text-6xl">
          <span className="block">Your morning paper for</span>
          <RotatingWord words={ROTATING} className="text-glow" />
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          Dayline reads trusted newsrooms and official alerts overnight, then hands you one short, source-linked paper at 06:00 Pakistan time. Read
          it on the web or as a PDF.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signin?mode=create" className={pill}>
            Create my paper
          </Link>
          <a href="#sample" className={ghostPill}>
            See a sample
          </a>
        </div>
        <p className="mt-5 text-sm text-muted">
          Free. Already reading Dayline?{" "}
          <Link href="/signin" className="font-semibold text-ink underline decoration-glow/60 underline-offset-4 hover:decoration-glow">
            Sign in
          </Link>
        </p>
      </Reveal>
      <Reveal className="relative mx-auto mt-16 max-w-5xl">
        <div id="sample" className="scroll-mt-24">
          <ProductShot />
        </div>
        <p className="mt-14 text-center text-xs text-muted">
          A real Dayline paper, generated on 17 October 2026 for a test reader following Technology, Space and Cybersecurity.{" "}
          <a href="/api/pdf/sample" className="font-semibold text-glow underline-offset-4 hover:underline">
            Download a sample PDF layout
          </a>
        </p>
      </Reveal>
    </section>
  );
}

function renderSources() {
  return (
    <section id="sources" aria-labelledby="sources-heading" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <InView className="mx-auto max-w-3xl text-center">
        <h2 id="sources-heading" className="font-serif text-3xl font-bold text-ink sm:text-5xl">
          All your morning reading in one place.
        </h2>
        <p className="mt-4 text-lg text-muted">No more checking a dozen sites. Choose what you follow and Dayline gathers it into one paper.</p>
      </InView>
      <RevealGroup className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCES.map((source) => (
          <RevealCell key={source.topic} className="rounded-2xl border border-ink/5 bg-card p-6 transition-colors duration-[185ms] hover:border-ink/20">
            <TopicIcon topic={source.topic} className="size-7 text-glow" />
            <h3 className="mt-4 text-xl font-semibold text-ink">{source.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-muted">{source.text}</p>
          </RevealCell>
        ))}
        <RevealCell className="flex flex-col justify-between rounded-2xl border border-dashed border-ink/15 p-6">
          <p className="text-xl font-semibold text-ink">Ten sources, seven topics.</p>
          <a href="#how" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-glow">
            How Dayline picks stories <span aria-hidden="true">→</span>
          </a>
        </RevealCell>
      </RevealGroup>
    </section>
  );
}

function textOrder(index: number): string | undefined {
  if (index % 2 === 1) {
    return "lg:order-2";
  }
  return undefined;
}

function slideFrom(index: number, visual: boolean): "left" | "right" {
  if ((index % 2 === 1) !== visual) {
    return "right";
  }
  return "left";
}

function renderSections() {
  return (
    <div className="space-y-24 px-4 py-20 sm:px-6">
      {SECTIONS.map((section, index) => (
        <section key={section.title} className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <InView className={textOrder(index)} from={slideFrom(index, false)}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-glow">{section.eyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">{section.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{section.text}</p>
          </InView>
          <InView from={slideFrom(index, true)}>{section.visual}</InView>
        </section>
      ))}
    </div>
  );
}

function renderSteps() {
  return (
    <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-ink/5 bg-card px-6 py-12 sm:px-12">
        <InView className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-glow">How it works</p>
          <h2 id="how-heading" className="mt-3 font-serif text-3xl font-bold text-ink sm:text-4xl">
            From your topics to tomorrow&apos;s paper
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Stories are ranked by how well they match your topics, how fresh they are and how widely they are covered, with no more than about two
            from any one source.
          </p>
        </InView>
        <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <RevealCell key={step.title} className="rounded-2xl bg-paper p-6">
              <span className="font-serif text-3xl font-bold text-glow" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </RevealCell>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function renderClosing() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,var(--glow-warm),transparent_70%)]"
      />
      <InView className="relative">
        <h2 className="font-serif text-3xl font-bold text-ink sm:text-5xl">
          Five minutes. Every morning.
          <br />
          Only what you follow.
        </h2>
        <Link href="/signin?mode=create" className={`${pill} mt-9`}>
          Create my paper
        </Link>
        <p className="mt-4 text-sm text-muted">On the web and as a PDF. Ready at 06:00 Pakistan time.</p>
      </InView>
    </section>
  );
}

export default function OverviewPage() {
  return (
    <main id="content" className="flex-1 overflow-x-clip bg-paper">
      {renderHero()}
      {renderSources()}
      {renderSections()}
      {renderSteps()}
      {renderClosing()}
    </main>
  );
}
