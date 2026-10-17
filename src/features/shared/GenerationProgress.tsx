"use client";

import { AnimatePresence, motion } from "motion/react";
import { useFormStatus } from "react-dom";
import { collapse } from "./motion";

const STEPS = ["Collecting today's stories from your sources", "Ranking them for your topics", "Writing short grounded summaries", "Saving your paper"];

function renderPanel(pending: boolean, message: string) {
  if (!pending) {
    return null;
  }
  return (
    <motion.div key="progress" variants={collapse} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
      <div className="mt-4 rounded-lg border border-rule bg-paper p-4">
        <p className="font-semibold">{message}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-rule" aria-hidden="true">
          <motion.div className="h-full w-1/3 rounded-full bg-accent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }} />
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {STEPS.map((step) => (
            <li key={step}>· {step}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">This usually takes 10 to 30 seconds. Please keep this page open.</p>
      </div>
    </motion.div>
  );
}

export function GenerationProgress({ message }: { message: string }) {
  const { pending } = useFormStatus();
  return (
    <div aria-live="polite">
      <AnimatePresence>{renderPanel(pending, message)}</AnimatePresence>
    </div>
  );
}
