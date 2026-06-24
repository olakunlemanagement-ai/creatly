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

  // Look up the user's active subscription plan_id (if any) so the page
  // can highlight their current plan. This is server-side — no stale client state.
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
    <div className="container mx-auto max-w-4xl px-4 py-20">
      {/* Hero */}
      <div className="mb-14 text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
          // PRICING
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

      {/* Pricing grid with toggle — client component */}
      <PricingGrid
        currentPlanId={currentPlanId}
        authenticated={!!auth}
      />

      {/* Feature comparison table */}
      <div className="mt-20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 text-left font-medium text-muted-foreground">Features</th>
              <th className="py-3 text-center font-medium text-foreground">Solo</th>
              <th className="py-3 text-center font-medium text-foreground">Team</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              ["Unlimited downloads", "✓", "✓"],
              ["All assets (templates, fonts, mockups…)", "✓", "✓"],
              ["Weekly new releases", "✓", "✓"],
              ["Commercial license", "✓", "✓"],
              ["Team workspace", "—", "✓"],
              ["Seats", "1", "5"],
              ["Priority support", "—", "✓"],
              ["Shared billing", "—", "✓"],
            ].map(([feature, solo, team]) => (
              <tr key={feature}>
                <td className="py-3 text-muted-foreground">{feature}</td>
                <td className="py-3 text-center text-foreground">{solo}</td>
                <td className="py-3 text-center text-foreground">{team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <PricingFAQ />
      </div>
    </div>
  );
}
