import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";

export function PricingTeaser() {
  return (
    <section className="bg-background px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {"// Pricing"}
              </p>
              <h2
                className="mt-3 font-heading text-3xl text-foreground sm:text-4xl"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
              >
                One subscription.
                <br />
                <span className="text-terracotta-600">Everything unlocked.</span>
              </h2>
              <p className="mt-4 max-w-[400px] text-sm leading-relaxed text-muted-foreground">
                Flat monthly pricing in Naira. Download unlimited assets, cancel any time.
                Team plans available for agencies.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <Link
                href="/pricing"
                className="rounded-xl bg-terracotta-500 px-7 py-3.5 text-center text-sm font-semibold text-white transition-all hover:bg-terracotta-600 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 motion-reduce:transition-none"
              >
                See plans →
              </Link>
              <Link
                href="/browse"
                className="rounded-xl border border-border px-7 py-3.5 text-center text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Browse first
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
