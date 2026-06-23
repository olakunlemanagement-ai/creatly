"use client";

import { useEffect, useState } from "react";

/** Returns true once the page has scrolled past the very top (scrollY > 0). */
export function useScrollPosition(): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrolled;
}
