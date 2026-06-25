import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingGrid } from "@/components/pricing/PricingGrid";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Pricing — ${APP_NAME}`,
  description: "Subscribe to download unlimited creative resources for African creatives.",
};

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
    <div className="container mx-auto max-w-6xl px-4 py-20">
      {/* Hero */}
      <div className="mb-14 text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
          {"// PRICING"}
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Unlimited downloads.
          <br />
          <span className="text-accent">One simple price.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Subscribe to access every template, font, mockup, and motion asset on {APP_NAME}.
          New resources added every week.
        </p>
      </div>

      {/* 4-column plan grid */}
      <PricingGrid currentPlanId={currentPlanId} authenticated={!!auth} />

      {/* FAQ */}
      <div className="mt-20">
        <PricingFAQ />
      </div>
    </div>
  );
}
