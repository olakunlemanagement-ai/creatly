import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

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
              <Button variant="terracotta" size="cta" asChild>
                <Link href="/pricing">
                  See plans
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
                </Link>
              </Button>
              <Button variant="ghost-terracotta" size="cta" asChild>
                <Link href="/browse">Browse first</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
