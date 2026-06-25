import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingGrid } from "@/components/pricing/PricingGrid";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Upgrade — ${APP_NAME}`,
};

export default async function BillingUpgradePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/billing/upgrade");

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id")
    .eq("owner_id", auth.user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <a href="/billing" className="text-sm text-accent underline">
          ← Back to billing
        </a>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Upgrade your plan</h1>
        <p className="mt-2 text-muted-foreground">
          Choosing a new plan starts a fresh Paystack checkout — no proration in V1.
        </p>
      </div>
      <PricingGrid currentPlanId={sub?.plan_id ?? null} authenticated />
    </div>
  );
}
