import type { Transition, Variants } from "motion/react";

export const EASE = [0.2, 0, 0, 1] as const;

export const DURATION = { press: 0.115, quick: 0.185, blink: 0.3, glide: 0.485 } as const;

export const transition: Transition = { duration: DURATION.blink, ease: EASE };

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.glide, ease: EASE } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.quick, ease: EASE } },
};

export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition },
  exit: { opacity: 0, transition: { duration: DURATION.quick, ease: EASE } },
};

export const stagger: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition },
  exit: { height: 0, opacity: 0, transition: { duration: DURATION.quick, ease: EASE } },
};
