"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { DURATION, EASE } from "@/features/shared/motion";

const PKT_OFFSET_MS = 5 * 3_600_000;
const RUN_HOUR_PKT = 6;

function nextRun(now: number): number {
  const pkt = new Date(now + PKT_OFFSET_MS);
  const target = Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate(), RUN_HOUR_PKT) - PKT_OFFSET_MS;
  if (target > now) {
    return target;
  }
  return target + 86_400_000;
}

function parts(ms: number): { label: string; value: string }[] {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    { label: "hours", value: pad(Math.floor(total / 3600)) },
    { label: "minutes", value: pad(Math.floor((total % 3600) / 60)) },
    { label: "seconds", value: pad(total % 60) },
  ];
}

function separator(index: number, count: number): string {
  if (index < count - 1) {
    return ":";
  }
  return "";
}

function Digit({ value, animate }: { value: string; animate: boolean }) {
  return (
    <span className="relative inline-grid overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={animate ? { y: "-100%", opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: DURATION.blink, ease: EASE }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function NextPaperCountdown() {
  const reduced = useReducedMotion();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) {
    return <p className="font-serif text-3xl font-bold tabular-nums text-ink">--:--:--</p>;
  }
  const remaining = parts(nextRun(now) - now);
  return (
    <p className="flex items-baseline gap-1 font-serif text-3xl font-bold tabular-nums text-ink" aria-label={`Next paper in ${remaining.map((p) => `${p.value} ${p.label}`).join(", ")}`}>
      {remaining.map((part, index) => (
        <span key={part.label} className="flex items-baseline gap-1" aria-hidden="true">
          <Digit value={part.value} animate={!reduced} />
          <span className="text-muted">{separator(index, remaining.length)}</span>
        </span>
      ))}
    </p>
  );
}
