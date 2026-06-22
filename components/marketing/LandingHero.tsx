import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section
      className="px-4 py-24 sm:px-6 sm:py-32"
      style={{
        background:
          "radial-gradient(ellipse at 65% 0%, oklch(0.33 0.10 148), oklch(0.20 0.07 148))",
      }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h1
          className="hero-animate font-heading text-4xl leading-tight text-cream-100 sm:text-6xl"
          style={{
            animationDuration: "500ms",
            animationFillMode: "both",
            animationName: "hero-in",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          Unlimited creative resources for{" "}
          <span className="text-terracotta-300">African talent</span>
        </h1>

        <p
          className="hero-animate mt-5 text-base text-cream-200 sm:text-xl"
          style={{
            animationDuration: "500ms",
            animationDelay: "80ms",
            animationFillMode: "both",
            animationName: "hero-in",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          One subscription. Every template, font, mockup, and motion asset you
          need — curated for African brands and markets.
        </p>

        <div
          className="hero-animate mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{
            animationDuration: "500ms",
            animationDelay: "160ms",
            animationFillMode: "both",
            animationName: "hero-in",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Button
            size="lg"
            className="w-full bg-terracotta-500 text-white hover:bg-terracotta-600 sm:w-auto"
            asChild
          >
            <Link href="/browse">Browse resources</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-cream-200/40 bg-transparent text-cream-100 hover:bg-white/10 hover:text-cream-100 sm:w-auto"
            asChild
          >
            <Link href="/signup">Get started free</Link>
          </Button>
        </div>

        <p
          className="hero-animate mt-5 text-xs text-cream-300"
          style={{
            animationDuration: "500ms",
            animationDelay: "240ms",
            animationFillMode: "both",
            animationName: "hero-in",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          Templates · Fonts · Mockups · Motion assets · New assets added weekly
        </p>
      </div>
    </section>
  );
}
