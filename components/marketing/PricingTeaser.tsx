import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/Reveal";

export function PricingTeaser() {
  return (
    <section className="bg-brand-green-900 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="font-heading text-3xl text-cream-100 sm:text-4xl">
            One subscription,{" "}
            <span className="text-terracotta-300">everything included</span>
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <p className="mt-4 text-cream-300">
            Flat-rate access to the full library. Personal plans for solo
            creatives, team plans for studios. Billed in Naira — no forex
            surprises.
          </p>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full bg-terracotta-500 text-white hover:bg-terracotta-600 sm:w-auto"
              asChild
            >
              <Link href="/pricing">See pricing</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-cream-200/30 bg-transparent text-cream-200 hover:bg-white/10 hover:text-cream-100 sm:w-auto"
              asChild
            >
              <Link href="/browse">Browse first</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
