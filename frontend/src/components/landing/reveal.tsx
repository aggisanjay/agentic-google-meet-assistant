"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Viewport-triggered blur-rise. Always settles visible; honours reduced motion. */
export function Reveal({
  children, delay = 0, y = 28, className, amount = 0.2,
}: { children: ReactNode; delay?: number; y?: number; className?: string; amount?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
