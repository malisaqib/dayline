"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE, fadeUp, stagger } from "./motion";

type Props = { children: ReactNode; className?: string };

const VIEWPORT = { once: true, margin: "-60px" } as const;

const SLIDE: Record<"up" | "left" | "right", Variants> = {
  up: fadeUp,
  left: { initial: { opacity: 0, x: -48 }, animate: { opacity: 1, x: 0, transition: { duration: DURATION.glide * 1.4, ease: EASE } } },
  right: { initial: { opacity: 0, x: 48 }, animate: { opacity: 1, x: 0, transition: { duration: DURATION.glide * 1.4, ease: EASE } } },
};

function useEntrance(): "initial" | false {
  return useReducedMotion() ? false : "initial";
}

export function RevealList({ children, className, label }: Props & { label?: string }) {
  return (
    <motion.ol variants={stagger} initial={useEntrance()} whileInView="animate" viewport={VIEWPORT} className={className} aria-label={label}>
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
    <motion.div variants={stagger} initial={useEntrance()} whileInView="animate" viewport={VIEWPORT} className={className}>
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

export function InView({ children, className, from = "up" }: Props & { from?: "up" | "left" | "right" }) {
  return (
    <motion.div variants={SLIDE[from]} initial={useEntrance()} whileInView="animate" viewport={VIEWPORT} className={className}>
      {children}
    </motion.div>
  );
}
