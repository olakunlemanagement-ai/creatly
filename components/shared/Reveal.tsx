"use client";

import { useReveal } from "@/hooks/useReveal";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Fades + translates children into view as they enter the viewport.
 * Pass `delay` (ms) to stagger sibling reveals.
 * Motion is disabled automatically when prefers-reduced-motion is set.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, isVisible } = useReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 420ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 420ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
