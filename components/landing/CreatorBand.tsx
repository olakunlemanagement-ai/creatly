import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";

export function CreatorBand() {
  return (
    <section className="relative overflow-hidden bg-brand-green-900 px-5 py-20 sm:px-6 sm:py-24">
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Terracotta glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(200,115,46,0.07) 0%, transparent 60%)" }} />

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-cream-300/60">
            {"// For creators"}
          </p>
        </Reveal>

        <Reveal delay={60}>
          <h2
            className="mt-4 max-w-[520px] font-heading text-4xl leading-snug text-cream-100 sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
          >
            Sell your work to creatives across Africa.
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-5 max-w-[480px] text-base leading-relaxed text-cream-200/70">
            Upload your templates, fonts, and mockups. Earn proportionally every time someone downloads your work — with Paystack payouts in NGN.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/creators"
              className="inline-flex items-center rounded-xl bg-terracotta-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-terracotta-600 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 motion-reduce:transition-none"
            >
              Become a creator →
            </Link>
            <p className="text-xs text-cream-300/50">
              Applications open. Launch in minutes.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
