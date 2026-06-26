import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { checkoutSchema } from "@/lib/validations/checkout";
import { PLANS } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    // 1. AUTH
    const auth = await getAuthenticatedUser();
    if (!auth) return fail("unauthorized", "Sign in to continue.", 401);

    // 2. VALIDATE
    const body: unknown = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return fail("invalid_input", "Invalid plan selection.", 422);

    const { planId } = parsed.data;
    const plan = PLANS[planId as keyof typeof PLANS];

    // 3. Generate idempotency reference
    const reference = crypto.randomUUID();

    // 4. Insert payment_references BEFORE calling Paystack (idempotency first)
    const supabase = await createClient();
    const { error: insertError } = await supabase.from("payment_references").insert({
      reference,
      user_id: auth.user.id,
      plan_id: planId,
      kobo: plan.kobo,
      status: "pending",
    });

    if (insertError) {
      // Duplicate reference (extremely unlikely with UUIDs) — still safe to surface
      if (insertError.code === "23505") {
        return fail("conflict", "Duplicate reference. Please try again.", 409);
      }
      console.error("[checkout] payment_references insert error:", insertError);
      return fail("internal_error", "Failed to initialise payment. Please try again.", 500);
    }

    // 5. Paystack transaction initialisation
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: auth.user.email,
        amount: plan.kobo,
        currency: "NGN",
        reference,
        callback_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/callback`,
        metadata: { user_id: auth.user.id, plan_id: planId, kobo: plan.kobo },
      }),
    });

    const paystackData = (await paystackRes.json()) as { status: boolean; data?: { authorization_url: string } };
    if (!paystackData.status || !paystackData.data?.authorization_url) {
      console.error("[checkout] Paystack init failed:", paystackData);
      return fail("payment_init_failed", "Could not initialise payment.", 502);
    }

    return ok({ authorization_url: paystackData.data.authorization_url });
  } catch (err) {
    console.error("[checkout] unexpected error:", err);
    return fail("internal_error", "Something went wrong. Please try again.", 500);
  }
}
