"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

interface CreatorHeroProps {
  displayName: string;
}

export function CreatorHero({ displayName }: CreatorHeroProps) {
  return (
    <section
      id="landing-hero"
      className="hero-gradient-mesh relative overflow-hidden"
      style={{ minHeight: "88vh" }}
    >
      {/* Logo — shown while navbar is hidden at scrollY 0 */}
      <div className="absolute left-5 top-5 z-10 sm:left-6 sm:top-6">
        <Link href="/" aria-label="Home">
          <Logo variant="full" tone="cream" size={28} />
        </Link>
      </div>

      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto flex min-h-[inherit] max-w-7xl flex-col items-start justify-center px-5 pb-16 pt-28 lg:pt-32">
        <Reveal delay={0}>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-terracotta-400">
            {"// CREATOR DASHBOARD"}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1
            className="mt-5 max-w-[640px] font-heading text-5xl leading-[1.08] text-cream-100 sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
          >
            Welcome back,{" "}
            <span className="text-terracotta-400">{displayName}</span>.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 max-w-[480px] text-base leading-relaxed text-cream-200/75 sm:text-lg">
            Your work is live on Creatly. Manage uploads, track downloads, and grow your catalogue.
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
              <Link href="/creator">
                <LayoutDashboard className="size-4" />
                Go to Studio
                <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
              </Link>
            </Button>
            <Button variant="ghost-cream" size="cta" asChild>
              <Link href="/browse">Browse marketplace</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-8 font-mono text-xs text-cream-300/60">
            Templates · Fonts · Mockups · Motion assets
          </p>
        </Reveal>
      </div>
    </section>
  );
}
