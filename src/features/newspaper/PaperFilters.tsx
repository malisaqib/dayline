"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ui } from "@/features/shared/ui";

type FilterState = { topic: string | null; setTopic: (topic: string | null) => void };

const FilterContext = createContext<FilterState>({ topic: null, setTopic: () => {} });

export type TopicCount = { topic: string; label: string; count: number };

function revealTarget(hash: string) {
  const target = document.getElementById(hash.slice(1));
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function PaperFilterProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#story-"]');
      if (!link) {
        return;
      }
      const hash = link.getAttribute("href") as string;
      const wrapper = document.getElementById(hash.slice(1))?.closest("[data-filtered-out='true']");
      if (!wrapper) {
        return;
      }
      event.preventDefault();
      setTopic(null);
      window.requestAnimationFrame(() => revealTarget(hash));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <FilterContext.Provider value={{ topic, setTopic }}>{children}</FilterContext.Provider>;
}

const CHIP = "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-[185ms]";

function chipClass(active: boolean): string {
  if (active) {
    return `${CHIP} border-accent bg-accent font-semibold text-night`;
  }
  return `${CHIP} border-rule text-ink/80 hover:border-ink/40`;
}

export function FilterNav({ counts, total }: { counts: TopicCount[]; total: number }) {
  const { topic, setTopic } = useContext(FilterContext);
  return (
    <div role="group" aria-label="Show stories by topic" className="flex gap-2 overflow-x-auto pb-1">
      <button type="button" aria-pressed={topic === null} className={chipClass(topic === null)} onClick={() => setTopic(null)}>
        All stories <span className="opacity-70">{total}</span>
      </button>
      {counts.map((item) => (
        <button key={item.topic} type="button" aria-pressed={topic === item.topic} className={chipClass(topic === item.topic)} onClick={() => setTopic(item.topic)}>
          {item.label} <span className="opacity-70">{item.count}</span>
        </button>
      ))}
    </div>
  );
}

export function FilteredStory({ topics, children }: { topics: string[]; children: ReactNode }) {
  const { topic } = useContext(FilterContext);
  const hidden = topic !== null && !topics.includes(topic);
  return (
    <div hidden={hidden} data-filtered-out={String(hidden)}>
      {children}
    </div>
  );
}

export function DownloadAction({ href }: { href: string }) {
  const { topic, setTopic } = useContext(FilterContext);
  if (topic === null) {
    return (
      <a href={href} className={`${ui.primaryButton} col-span-2`}>
        Download PDF
      </a>
    );
  }
  return (
    <>
      <a href={href} className={ui.primaryButton}>
        Download full paper
      </a>
      <button type="button" className={ui.secondaryButton} onClick={() => setTopic(null)}>
        Show all stories
      </button>
    </>
  );
}

function storyWord(count: number): string {
  if (count === 1) {
    return "story";
  }
  return "stories";
}

export function FilterNotice({ counts }: { counts: TopicCount[] }) {
  const { topic, setTopic } = useContext(FilterContext);
  const active = counts.find((item) => item.topic === topic);
  if (!active) {
    return null;
  }
  return (
    <p role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-card px-4 py-2 text-sm">
      Showing {active.count} {active.label} {storyWord(active.count)}. Filters only change this view; the saved paper and PDF keep every story.
      <button type="button" className="font-semibold text-accent-strong underline underline-offset-4" onClick={() => setTopic(null)}>
        Show all stories
      </button>
    </p>
  );
}
