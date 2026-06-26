import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingGrid } from "@/components/pricing/PricingGrid";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { APP_NAME } from "@/lib/config";
import { Check, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: `Pricing — ${APP_NAME}`,
  description: "Subscribe to download unlimited creative resources for African creatives.",
};

const INCLUDED = [
  "Unlimited downloads on every plan",
  "All templates, fonts, mockups & motion",
  "New assets every week",
  "Commercial licence included",
  "Cancel anytime",
];

export default async function PricingPage() {
  const auth = await getAuthenticatedUser();

  let currentPlanId: string | null = null;
  if (auth) {
    const supabase = await createClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("owner_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();
    currentPlanId = sub?.plan_id ?? null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-forest-900 px-5 py-24 sm:px-6">
        {/* Subtle grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-terracotta-500/30 bg-terracotta-500/10 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-terracotta-400">
            <Zap className="h-3 w-3" />
            Simple pricing
          </span>

          <h1
            className="mt-6 font-heading text-4xl font-bold leading-tight text-cream-100 sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
          >
            Choose your plan.
            <br />
            <span className="text-terracotta-400">Download everything.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-cream-200/70 sm:text-lg">
            One subscription unlocks every template, font, mockup, and motion asset on {APP_NAME}.
            Pay for the duration that works for you.
          </p>
        </div>
      </section>

      {/* ── Plan cards ───────────────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <PricingGrid currentPlanId={currentPlanId} authenticated={!!auth} />
        </div>
      </section>

      {/* ── What's included ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/40 px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {"// Every plan includes"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green-700/10">
                  <Check className="h-3.5 w-3.5 text-brand-green-700" />
                </span>
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {"// FAQ"}
          </p>
          <h2
            className="mb-10 font-heading text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Common questions
          </h2>
          <PricingFAQ />
        </div>
      </section>
    </div>
  );
}
