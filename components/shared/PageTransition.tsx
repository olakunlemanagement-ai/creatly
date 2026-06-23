"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  // Always wrap in AnimatePresence + keyed motion.div so React never reconciles
  // two different layout trees at the same position (which would change the hook
  // count of whichever header component sits inside the layout).
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
