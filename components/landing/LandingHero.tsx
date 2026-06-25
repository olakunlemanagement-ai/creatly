"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

// Each collage item: positioning/shadow classes + final rotate value for FM animation
const COLLAGE = [
  { src: "/seed/social-instagram-story.svg", w: 200, h: 220, rotate: -4,  pos: "absolute top-[6%]  left-[5%]  z-20 shadow-2xl rounded-xl" },
  { src: "/seed/deck-pitch.svg",             w: 230, h: 175, rotate:  2.5, pos: "absolute top-[12%] left-[36%] z-10 shadow-xl  rounded-xl" },
  { src: "/seed/font-lagos-display.svg",     w: 185, h: 185, rotate: -2,   pos: "absolute top-[52%] left-[18%] z-30 shadow-2xl rounded-xl" },
  { src: "/seed/mockup-phone.svg",           w: 155, h: 200, rotate:  4,   pos: "absolute top-[50%] left-[58%] z-20 shadow-xl  rounded-xl" },
  { src: "/seed/brand-afrobeat-kit.svg",     w: 170, h: 170, rotate: -1.5, pos: "absolute top-[3%]  left-[66%] z-10 shadow-lg  rounded-xl" },
] as const;

// Word-by-word headline definition
const LINE_ONE = [
  { text: "Everything ", accent: false },
  { text: "a ",          accent: false },
  { text: "creative",    accent: true  },
];
const LINE_TWO = [
  { text: "needs ",  accent: false },
  { text: "to ",     accent: false },
  { text: "build.",  accent: false },
];

// Bezier must be typed as a 4-tuple for Framer Motion's strict types
const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const sentenceVariants = {
  hidden:  { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
} as const;
const wordVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EXPO_OUT } },
} as const;

export function LandingHero() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="landing-hero"
      className="hero-gradient-mesh relative overflow-hidden"
      style={{ minHeight: "88vh" }}
    >
      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Grid layout */}
      <div className="relative mx-auto grid min-h-[inherit] max-w-7xl grid-cols-1 gap-0 px-5 pb-16 pt-28 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-8 lg:pt-32">

        {/* Left: Text column */}
        <div className="flex flex-col items-start justify-center">
          <Reveal delay={0}>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-terracotta-400">
              {"// Subscription-based creative library"}
            </p>
          </Reveal>

          {/* Word-by-word headline */}
          <motion.h1
            className="mt-5 max-w-[580px] font-heading text-5xl leading-[1.08] text-cream-100 sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            variants={prefersReduced ? undefined : sentenceVariants}
            initial={prefersReduced ? false : "hidden"}
            animate="visible"
          >
            {LINE_ONE.map(({ text, accent }, i) => (
              <motion.span
                key={i}
                variants={prefersReduced ? undefined : wordVariants}
                className={accent ? "text-terracotta-400" : ""}
              >
                {text}
              </motion.span>
            ))}
            <br />
            {LINE_TWO.map(({ text }, i) => (
              <motion.span key={i} variants={prefersReduced ? undefined : wordVariants}>
                {text}
              </motion.span>
            ))}
          </motion.h1>

          <Reveal delay={160}>
            <p className="mt-6 max-w-[440px] text-base leading-relaxed text-cream-200/75 sm:text-lg">
              One subscription. Unlimited templates, fonts, mockups, and motion assets — curated for African brands and markets.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="terracotta"
                size="cta"
                className="cta-shimmer"
                asChild
              >
                <Link href="/browse">
                  Browse the library
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
                </Link>
              </Button>
              <Button variant="ghost-cream" size="cta" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <p className="mt-8 font-mono text-xs text-cream-300/60">
              Templates · Fonts · Mockups · Motion assets
            </p>
          </Reveal>
        </div>

        {/* Right: Animated image collage (lg+) */}
        <div className="relative hidden lg:block" style={{ height: "60vh", minHeight: 440 }}>
          {COLLAGE.map((item, i) => (
            <motion.div
              key={i}
              className={item.pos}
              initial={prefersReduced ? false : { opacity: 0, scale: 0.8, rotate: item.rotate - 4 }}
              animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
              transition={{ duration: 0.65, delay: 0.35 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={item.src}
                alt=""
                width={item.w}
                height={item.h}
                className="block h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile: horizontal thumbnail strip */}
        <div className="mt-10 flex gap-3 overflow-x-auto pb-2 lg:hidden" aria-hidden="true">
          {COLLAGE.slice(0, 3).map((item, i) => (
            <div key={i} className="shrink-0 overflow-hidden rounded-xl" style={{ width: 120, height: 120 }}>
              <Image
                src={item.src}
                alt=""
                width={120}
                height={120}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
