"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

export function ProductShot() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0.94, 1]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 60, 0]);

  return (
    <div ref={ref} className="relative [perspective:1600px]">
      <motion.div style={{ rotateX, scale }} className="origin-bottom overflow-hidden rounded-2xl border border-white/10 bg-night-card shadow-[0_40px_120px_-40px_rgb(240_138_114/0.45)]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="ml-3 hidden rounded-md bg-white/5 px-3 py-1 text-xs text-night-muted sm:block">dayline-swart.vercel.app / edition</span>
        </div>
        <Image
          src="/overview/edition.webp"
          alt="A Dayline paper for Saturday 17 October 2026 with its Signal Brief, Today in three and the list of stories"
          width={1140}
          height={820}
          priority
          className="h-auto w-full"
        />
      </motion.div>
      <motion.div
        style={{ y: phoneY }}
        className="absolute -bottom-10 -right-2 hidden w-44 overflow-hidden rounded-[2rem] border-[6px] border-[#1f2633] bg-night shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] md:block lg:-right-10 lg:w-52"
      >
        <Image src="/overview/edition-mobile.webp" alt="The same paper on a phone" width={390} height={844} className="h-auto w-full" />
      </motion.div>
    </div>
  );
}

export function PdfShot() {
  return (
    <motion.div
      initial={{ rotate: -3 }}
      whileHover={{ rotate: 0, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-md shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]"
    >
      <Image src="/overview/edition-pdf.webp" alt="First page of the same paper as a newspaper-style PDF" width={910} height={1287} className="h-auto w-full" />
    </motion.div>
  );
}
