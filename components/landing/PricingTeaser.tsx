import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/pricing";
import { formatNaira } from "@/lib/format";

export function PricingTeaser() {
  const plans = Object.values(PLANS);

  return (
    <section className="bg-background px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-12">
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
              </div>

              <Button variant="terracotta" size="cta" asChild className="shrink-0 self-start lg:self-auto">
                <Link href="/pricing">
                  See all plans
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-1 motion-reduce:transition-none" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {plans.map((plan) => {
                const featured = "featured" in plan && plan.featured === true;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-4 text-center ${
                      featured
                        ? "border-2 border-terracotta-600 bg-terracotta-600/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {plan.duration}
                    </p>
                    <p className={`font-display text-base font-bold ${featured ? "text-terracotta-600" : "text-foreground"}`}>
                      {plan.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatNaira(plan.kobo)}
                    </p>
                    {featured && (
                      <span className="mt-2 inline-block rounded-full bg-terracotta-600/10 px-2 py-0.5 text-xs font-semibold text-terracotta-600">
                        Most Popular
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
