"use client";

import { useEffect, useRef, useState } from "react";

type ScrollDir = "up" | "down";

export function useScrollDirection(threshold = 8): ScrollDir {
  const [dir, setDir] = useState<ScrollDir>("up");
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y === 0) {
        setDir("up");
        lastY.current = 0;
        return;
      }
      if (Math.abs(y - lastY.current) < threshold) return;
      setDir(y > lastY.current ? "down" : "up");
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return dir;
}
