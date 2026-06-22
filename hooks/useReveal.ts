"use client";

import { useEffect, useRef, useState } from "react";

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

interface UseRevealResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
}

export function useReveal({
  threshold = 0.12,
  rootMargin = "0px 0px -40px 0px",
}: UseRevealOptions = {}): UseRevealResult {
  const ref = useRef<HTMLDivElement | null>(null);

  // If the user prefers reduced motion, skip the animation entirely — start visible.
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [isVisible, setIsVisible] = useState(prefersReduced);

  useEffect(() => {
    if (prefersReduced || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [prefersReduced, threshold, rootMargin]);

  return { ref, isVisible };
}
