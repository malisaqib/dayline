"use client";

import { useEffect, useState } from "react";

const STORY_SELECTOR = "article[id^='story-']";
const SEEN_THRESHOLD = 0.5;

export function ReadingProgress({ total }: { total: number }) {
  const [seen, setSeen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target.id);
        if (visible.length === 0) {
          return;
        }
        setSeen((current) => {
          const fresh = visible.filter((id) => !current.has(id));
          if (fresh.length === 0) {
            return current;
          }
          return new Set([...current, ...fresh]);
        });
      },
      { threshold: SEEN_THRESHOLD },
    );
    document.querySelectorAll(STORY_SELECTOR).forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const count = Math.min(seen.size, total);
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  const label = `${count} of ${total} stories`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">Reading progress</span>
        <span className="text-muted">{label}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Stories reached"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={count}
        aria-valuetext={label}
        className="mt-2 h-2 overflow-hidden rounded-full bg-rule"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-[300ms]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
