"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useState, type ReactNode } from "react";
import { DURATION, EASE } from "@/features/shared/motion";

const SCROLLED = "border-ink/10 bg-paper/90 shadow-[0_10px_40px_-20px_rgb(240_138_114/0.5)]";
const AT_TOP = "border-transparent bg-transparent";

function headerClass(scrolled: boolean): string {
  if (scrolled) {
    return SCROLLED;
  }
  return AT_TOP;
}

function paddingClass(scrolled: boolean): string {
  if (scrolled) {
    return "py-1.5";
  }
  return "py-3";
}

export function ScrollHeader({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={reduced ? false : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: DURATION.glide, ease: EASE }}
      className={`sticky top-0 z-30 border-b text-ink backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-[300ms] ${headerClass(scrolled)}`}
    >
      <div className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[padding] duration-[300ms] sm:px-6 ${paddingClass(scrolled)}`}>{children}</div>
    </motion.header>
  );
}
