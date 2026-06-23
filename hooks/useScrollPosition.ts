"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when scrollY has reached or passed the bottom of the element
 * identified by `thresholdElementId`. If the element is not found (e.g. on
 * non-landing pages), threshold is 0 so the navbar is always visible.
 */
export function useScrollPosition(thresholdElementId?: string): boolean {
  const [pastThreshold, setPastThreshold] = useState(false);

  useEffect(() => {
    function getThreshold(): number {
      if (thresholdElementId) {
        return document.getElementById(thresholdElementId)?.offsetHeight ?? 0;
      }
      return 0;
    }

    function onScroll() {
      setPastThreshold(window.scrollY >= getThreshold());
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdElementId]);

  return pastThreshold;
}
