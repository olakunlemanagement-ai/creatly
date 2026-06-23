"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";

// Collage of UI-2 seed thumbnails — overlapping, rotated for energy
const COLLAGE = [
  { src: "/seed/social-instagram-story.svg", w: 200, h: 220, className: "absolute top-[6%] left-[5%] rotate-[-4deg] z-20 shadow-2xl rounded-xl" },
  { src: "/seed/deck-pitch.svg",             w: 230, h: 175, className: "absolute top-[12%] left-[36%] rotate-[2.5deg] z-10 shadow-xl rounded-xl" },
  { src: "/seed/font-lagos-display.svg",     w: 185, h: 185, className: "absolute top-[52%] left-[18%] rotate-[-2deg] z-30 shadow-2xl rounded-xl" },
  { src: "/seed/mockup-phone.svg",           w: 155, h: 200, className: "absolute top-[50%] left-[58%] rotate-[4deg] z-20 shadow-xl rounded-xl" },
  { src: "/seed/brand-afrobeat-kit.svg",     w: 170, h: 170, className: "absolute top-[3%] left-[66%] rotate-[-1.5deg] z-10 shadow-lg rounded-xl" },
] as const;

export function LandingHero() {
  return (
    <section
      className="relative overflow-hidden bg-brand-green-900"
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

      {/* Depth glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(200,115,46,0.06) 0%, transparent 65%)" }} />

      {/* Grid layout */}
      <div className="relative mx-auto grid min-h-[inherit] max-w-7xl grid-cols-1 gap-0 px-5 pt-28 pb-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-8 lg:pt-32">

        {/* Left: Text column */}
        <div className="flex flex-col items-start justify-center">
          <Reveal delay={0}>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-terracotta-400">
              {"// Subscription-based creative library"}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1
              className="mt-5 max-w-[580px] font-heading text-5xl leading-[1.08] text-cream-100 sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Everything a{" "}
              <span className="text-terracotta-400">creative</span>
              <br />
              needs to build.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-[440px] text-base leading-relaxed text-cream-200/75 sm:text-lg">
              One subscription. Unlimited templates, fonts, mockups, and motion assets — curated for African brands and markets.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-xl bg-terracotta-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-terracotta-600 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 motion-reduce:transition-none"
              >
                Start creating →
              </Link>
              <Link
                href="/browse"
                className="rounded-xl border border-cream-200/25 px-7 py-3.5 text-sm font-medium text-cream-200 transition-all hover:border-cream-200/50 hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-300 motion-reduce:transition-none"
              >
                Browse the library
              </Link>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <p className="mt-8 font-mono text-xs text-cream-300/60">
              Templates · Fonts · Mockups · Motion assets
            </p>
          </Reveal>
        </div>

        {/* Right: Image collage (hidden on mobile, shown lg+) */}
        <div className="relative hidden lg:block" style={{ height: "60vh", minHeight: 440 }}>
          {COLLAGE.map((item, i) => (
            <div key={i} className={item.className}>
              <Image
                src={item.src}
                alt=""
                width={item.w}
                height={item.h}
                className="block h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
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
