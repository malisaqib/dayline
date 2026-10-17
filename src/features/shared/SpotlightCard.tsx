"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "./cn";

type SpotlightCardProps = { children: ReactNode; className?: string; radius?: number };

export function SpotlightCard({ children, className, radius = 220 }: SpotlightCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mask = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, white, transparent 80%)`;

  function track(event: MouseEvent<HTMLDivElement>) {
    const { left, top } = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - left);
    y.set(event.clientY - top);
  }

  return (
    <div onMouseMove={track} className={cn("group/spotlight relative", className)}>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] bg-accent-soft opacity-0 transition-opacity duration-[300ms] group-hover/spotlight:opacity-100"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
