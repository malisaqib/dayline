"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { fadeUp } from "@/features/shared/motion";

const INTERVAL_MS = 2400;

export function RotatingWord({ words, className }: { words: string[]; className?: string }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % words.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduced, words.length]);

  return (
    <span className={`relative inline-grid ${className ?? ""}`}>
      <span className="sr-only">{words.join(", ")}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={words[index]} variants={fadeUp} initial="initial" animate="animate" exit="exit" aria-hidden="true" className="whitespace-nowrap">
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
