"use client";

/**
 * Creatly brand logo system — three variants, three tones, fully vector.
 *
 * Mark geometry: a stylised aperture "C" built from three overlapping arcs
 * — a main forest-green arc, a terracotta inner arc, and a cream gap —
 * evoking a lens aperture / woven loop (creativity, precision).
 *
 * Wordmark: "Creatly" with tight tracking; the descender dot on the 'y'
 * is rendered in terracotta for a micro brand moment.
 */

import type { SVGProps } from "react";

// ── Palette constants (defined here, not hardcoded per use)
const FOREST = "#1a3d2f";
const TERRACOTTA = "#c8732e";
const CREAM = "#f5f2ec";

type Variant = "full" | "mark" | "wordmark";
type Tone = "ink" | "cream" | "mono";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: Variant;
  tone?: Tone;
  /** Pixel size — height governs; width scales proportionally per variant */
  size?: number;
}

// Resolved colours per tone
function resolveColors(tone: Tone) {
  switch (tone) {
    case "cream":
      return { primary: CREAM, accent: TERRACOTTA, text: CREAM };
    case "mono":
      return { primary: "currentColor", accent: "currentColor", text: "currentColor" };
    case "ink":
    default:
      return { primary: FOREST, accent: TERRACOTTA, text: FOREST };
  }
}

// ── Mark (monogram "C" aperture) ───────────────────────────────────────────
function Mark({
  size = 32,
  colors,
  ...props
}: { size?: number; colors: ReturnType<typeof resolveColors> } & SVGProps<SVGSVGElement>) {
  const s = size;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/*
        Aperture / lens C — three-arc composition:
        1. Outer arc (forest): top-left to bottom-left, large radius
        2. Inner arc (terracotta): offset inward, offset clockwise gap
        3. The negative space between them creates the "C" letterform
      */}

      {/* 1. Outer forest arc — the main C body */}
      <path
        d="M 26 8
           A 13 13 0 1 0 26 24
           L 22 24
           A 9 9 0 1 1 22 8
           Z"
        fill={colors.primary}
      />

      {/* 2. Terracotta inner accent arc — sits in the opening of the C */}
      <path
        d="M 26 10
           L 28 7
           A 2 2 0 0 0 24 6
           L 22 9.5
           A 1.5 1.5 0 0 1 24.5 10
           Z"
        fill={colors.accent}
      />

      {/* 3. Bottom terracotta arc — mirrors top for visual balance */}
      <path
        d="M 26 22
           L 28 25
           A 2 2 0 0 1 24 26
           L 22 22.5
           A 1.5 1.5 0 0 0 24.5 22
           Z"
        fill={colors.accent}
      />

      {/* 4. Centre dot — terracotta anchor */}
      <circle cx="16" cy="16" r="2.5" fill={colors.accent} />
    </svg>
  );
}

// ── Wordmark ("Creatly" text with accent dot) ──────────────────────────────
function Wordmark({
  size = 24,
  colors,
  ...props
}: { size?: number; colors: ReturnType<typeof resolveColors> } & SVGProps<SVGSVGElement>) {
  const h = size;
  const w = Math.round(h * 5.5);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Creatly"
      {...props}
    >
      {/* Single text element — no split, no font-metric dependency */}
      <text
        x="0"
        y={h * 0.78}
        fontSize={h}
        fontWeight="700"
        letterSpacing="-0.03em"
        fontFamily="var(--font-heading, Georgia, serif)"
        fill={colors.text}
      >
        Creatly
      </text>
      {/* Terracotta accent dot — decorative, sits below the trailing 'y' */}
      <circle
        cx={w * 0.955}
        cy={h * 0.94}
        r={h * 0.055}
        fill={colors.accent}
      />
    </svg>
  );
}

// ── Full logo (mark + wordmark side by side) ────────────────────────────────
function FullLogo({
  size = 32,
  colors,
  ...props
}: { size?: number; colors: ReturnType<typeof resolveColors> } & SVGProps<SVGSVGElement>) {
  const gap = Math.round(size * 0.35);
  const markSize = size;
  const wordH = Math.round(size * 0.6);
  const wordW = Math.round(wordH * 5.5);
  const totalW = markSize + gap + wordW;

  return (
    <svg
      width={totalW}
      height={size}
      viewBox={`0 0 ${totalW} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Creatly"
      {...props}
    >
      {/* Mark */}
      <g transform={`translate(0, 0)`}>
        <Mark size={markSize} colors={colors} />
      </g>

      {/* Wordmark — vertically centred */}
      <g transform={`translate(${markSize + gap}, ${Math.round((size - wordH) / 2)})`}>
        <text
          x="0"
          y={wordH * 0.78}
          fontSize={wordH}
          fontWeight="700"
          letterSpacing="-0.03em"
          fontFamily="var(--font-heading, Georgia, serif)"
          fill={colors.text}
        >
          Creatly
        </text>
        <circle
          cx={wordW * 0.955}
          cy={wordH * 0.94}
          r={wordH * 0.055}
          fill={colors.accent}
        />
      </g>
    </svg>
  );
}

// ── Public export ───────────────────────────────────────────────────────────
export function Logo({
  variant = "full",
  tone = "ink",
  size = 32,
  ...props
}: LogoProps) {
  const colors = resolveColors(tone);

  switch (variant) {
    case "mark":
      return <Mark size={size} colors={colors} {...props} />;
    case "wordmark":
      return <Wordmark size={size} colors={colors} {...props} />;
    case "full":
    default:
      return <FullLogo size={size} colors={colors} {...props} />;
  }
}
