"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { transition } from "@/features/shared/motion";

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      {children}
    </MotionConfig>
  );
}
