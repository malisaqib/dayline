"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { collapse } from "./motion";

function renderPanel(open: boolean, id: string, children: ReactNode) {
  if (!open) {
    return null;
  }
  return (
    <motion.div key="panel" id={id} variants={collapse} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
      {children}
    </motion.div>
  );
}

export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const chevronClass = open ? "rotate-90" : "";
  return (
    <div className="mt-3 border-t border-rule pt-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold"
      >
        <span aria-hidden="true" className={`inline-block transition-transform duration-[185ms] ${chevronClass}`}>
          ›
        </span>
        {label}
      </button>
      <AnimatePresence initial={false}>{renderPanel(open, panelId, children)}</AnimatePresence>
    </div>
  );
}
