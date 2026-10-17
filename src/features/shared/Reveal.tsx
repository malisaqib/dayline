"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, stagger } from "./motion";

type Props = { children: ReactNode; className?: string };

function useEntrance(): "initial" | false {
  return useReducedMotion() ? false : "initial";
}

export function RevealList({ children, className, label }: Props & { label?: string }) {
  return (
    <motion.ol variants={stagger} initial={useEntrance()} animate="animate" className={className} aria-label={label}>
      {children}
    </motion.ol>
  );
}

export function RevealItem({ children, className }: Props) {
  return (
    <motion.li variants={fadeUp} layout="position" className={className}>
      {children}
    </motion.li>
  );
}

export function RevealGroup({ children, className }: Props) {
  return (
    <motion.div variants={stagger} initial={useEntrance()} animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function RevealCell({ children, className }: Props) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className }: Props) {
  return (
    <motion.div variants={fadeUp} initial={useEntrance()} animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function InView({ children, className }: Props) {
  return (
    <motion.div variants={fadeUp} initial={useEntrance()} whileInView="animate" viewport={{ once: true, margin: "-80px" }} className={className}>
      {children}
    </motion.div>
  );
}
