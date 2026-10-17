"use client";

import { motion } from "motion/react";
import { DURATION, EASE } from "./motion";

export function Spotlight({ className }: { className?: string }) {
  return (
    <motion.svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${className ?? ""}`}
      viewBox="0 0 3787 2842"
      fill="none"
      initial={{ opacity: 0, x: -40, y: -30 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: DURATION.glide * 4, ease: EASE }}
    >
      <g filter="url(#dayline-spotlight-blur)">
        <ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501" transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill="var(--accent)" fillOpacity="0.08" />
      </g>
      <defs>
        <filter id="dayline-spotlight-blur" x="0.86" y="0.84" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" />
        </filter>
      </defs>
    </motion.svg>
  );
}
