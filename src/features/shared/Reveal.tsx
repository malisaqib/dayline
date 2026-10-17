"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, stagger } from "./motion";

export function RevealList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <motion.ol variants={stagger} initial="initial" animate="animate" className={className} aria-label={label}>
      {children}
    </motion.ol>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.li variants={fadeUp} layout="position" className={className}>
      {children}
    </motion.li>
  );
}

export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function RevealCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}
