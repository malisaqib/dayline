"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp } from "@/features/shared/motion";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}
