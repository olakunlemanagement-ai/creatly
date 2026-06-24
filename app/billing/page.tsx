import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { PLANS } from "@/lib/pricing";
import type { PlanId } from "@/lib/pricing";
import { BillingCancelButton } from "./BillingCancelButton";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Billing — ${APP_NAME}`,
};

// SSR only — no stale subscription data
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/billing");

  const supabase = await createClient();

  // Current subscription (SSR — fresh on every load)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, status, plan_id, amount_kobo, current_period_end, cancel_at, paystack_sub_code")
    .eq("owner_id", auth.user.id)
    .in("status", ["active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Payment history — reads from payment_references (our table, no Paystack API call)
  const { data: payments } = await supabase
    .from("payment_references")
    .select("reference, plan_id, kobo, status, created_at, settled_at")
    .eq("user_id", auth.user.id)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(20);

  const plan = sub?.plan_id ? PLANS[sub.plan_id as PlanId] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-12 px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-foreground">Billing</h1>

      {/* Current plan */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Current plan
        </h2>
        <div className="rounded-2xl border border-border p-6">
          {sub && plan ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-bold text-foreground">{plan.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatNaira(plan.kobo)}/{plan.interval === "annual" ? "year" : "month"}
                    {sub.current_period_end && (
                      <>
                        {" · "}
                        {sub.cancel_at ? "Cancels" : "Renews"}{" "}
                        {new Date(sub.cancel_at ?? sub.current_period_end).toLocaleDateString(
                          "en-NG",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </>
                    )}
                  </p>
                  {sub.status === "past_due" && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                      Payment overdue — update your payment method in Paystack.
                    </p>
                  )}
                  {sub.cancel_at && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      Your subscription will end on{" "}
                      {new Date(sub.cancel_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      . You have full access until then.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <a
                    href="/billing/upgrade"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Upgrade
                  </a>
                  {!sub.cancel_at && <BillingCancelButton periodEnd={sub.current_period_end} />}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">You don&apos;t have an active subscription.</p>
              <a
                href="/pricing"
                className="mt-4 inline-block rounded-xl bg-brand-green-700 px-6 py-2.5 text-sm font-semibold text-cream-100 hover:bg-brand-green-800"
              >
                Browse plans →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Payment history */}
      {payments && payments.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Payment history
          </h2>
          <div className="divide-y divide-border rounded-2xl border border-border">
            {payments.map((p) => {
              const planLabel = p.plan_id ? (PLANS[p.plan_id as PlanId]?.label ?? p.plan_id) : "—";
              return (
                <div key={p.reference} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{planLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.settled_at
                        ? new Date(p.settled_at).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {formatNaira(p.kobo)}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-brand-green-500" title="Paid" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
