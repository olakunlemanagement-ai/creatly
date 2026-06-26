import { timingSafeEqual, createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/pricing";
import type { PlanId } from "@/lib/pricing";

// Paystack calls this endpoint — no Next.js auth middleware.
// Verification is HMAC-SHA512 of the raw request body against PAYSTACK_SECRET_KEY.

export async function POST(req: Request) {
  const body = await req.text(); // raw bytes needed for HMAC

  // ── HMAC signature verification ──────────────────────────────────────────────
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    console.error("[webhook] PAYSTACK_SECRET_KEY not set — rejecting request");
    return new Response("Forbidden", { status: 403 });
  }

  const sig = req.headers.get("x-paystack-signature") ?? "";
  const hash = createHmac("sha512", paystackKey).update(body).digest("hex");

  let hashBuf: Buffer, sigBuf: Buffer;
  try {
    hashBuf = Buffer.from(hash, "hex");
    sigBuf = Buffer.from(sig, "hex");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  if (hashBuf.length !== sigBuf.length || !timingSafeEqual(hashBuf, sigBuf)) {
    return new Response("Forbidden", { status: 403 });
  }

  // ── Parse event ──────────────────────────────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const supabase = createAdminClient(); // service_role: bypasses RLS — webhook is sole writer
  const eventName = event.event as string | undefined;
  const data = event.data as Record<string, unknown> | undefined;

  // ── charge.success ────────────────────────────────────────────────────────────
  if (eventName === "charge.success" && data) {
    const reference = data.reference as string | undefined;
    const metadata  = (data.metadata ?? {}) as Record<string, unknown>;
    const userId    = metadata.user_id  as string | undefined;
    const planId    = metadata.plan_id  as string | undefined;
    const metaKobo  = metadata.kobo     as number | undefined;

    if (!reference || !userId || !planId) {
      console.error("[webhook] charge.success missing required fields", { reference, userId, planId });
      return new Response("OK", { status: 200 }); // don't let Paystack retry a malformed event
    }

    // ── Idempotency check ────────────────────────────────────────────────────────
    // Check subscription_events for this reference — prevents processing twice.
    const { data: existing } = await supabase
      .from("subscription_events")
      .select("id")
      .eq("paystack_ref", reference)
      .maybeSingle();

    if (existing) {
      return new Response("OK", { status: 200 }); // already processed
    }

    const plan = PLANS[planId as PlanId];
    if (!plan) {
      console.error("[webhook] unknown plan_id:", planId);
      return new Response("OK", { status: 200 });
    }

    // Defence-in-depth: verify the amount matches what we expect for this plan.
    const eventKobo = (data.amount as number | undefined) ?? metaKobo;
    if (eventKobo && eventKobo !== plan.kobo) {
      console.error("[webhook] amount mismatch", { planId, expected: plan.kobo, got: eventKobo });
      return new Response("Amount mismatch", { status: 422 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + plan.months);

    // ── Upsert subscription — webhook is the sole writer ─────────────────────
    // Uses owner_id (our column) mapped from metadata.user_id.
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          owner_id:              userId,
          plan_id:               planId,
          plan_type:             planId as string,      // keep legacy column in sync
          amount_kobo:           plan.kobo,
          max_seats:             1,
          status:                "active",
          current_period_start:  now.toISOString(),
          current_period_end:    periodEnd.toISOString(),
          paystack_sub_code:     (data.subscription_code as string | undefined) ?? null,
          updated_at:            now.toISOString(),
        },
        { onConflict: "owner_id" }
      )
      .select("id")
      .single();

    if (subError || !sub) {
      console.error("[webhook] subscription upsert error:", subError);
      return new Response("Internal error", { status: 500 }); // Paystack will retry
    }

    // ── Mark payment_reference settled ──────────────────────────────────────────
    await supabase
      .from("payment_references")
      .update({ status: "success", settled_at: now.toISOString() })
      .eq("reference", reference);

    // ── Append to subscription_events (immutable audit log) ─────────────────────
    await supabase.from("subscription_events").insert({
      subscription_id: sub.id,
      paystack_event:  "charge.success",
      paystack_ref:    reference,
      payload:         event,
    });

    return new Response("OK", { status: 200 });
  }

  // ── subscription.disable ─────────────────────────────────────────────────────
  // Paystack fires this when a subscription is cancelled or fails to renew.
  // We set status = 'cancelled' (maps to Paystack's 'inactive').
  if ((eventName === "subscription.disable" || eventName === "invoice.payment_failed") && data) {
    const subCode = data.subscription_code as string | undefined;
    if (!subCode) return new Response("OK", { status: 200 });

    const now = new Date().toISOString();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("paystack_sub_code", subCode)
      .maybeSingle();

    if (sub) {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: now })
        .eq("paystack_sub_code", subCode);

      await supabase.from("subscription_events").insert({
        subscription_id: sub.id,
        paystack_event:  eventName,
        paystack_ref:    null,
        payload:         event,
      });
    }

    return new Response("OK", { status: 200 });
  }

  // ── transfer.success ─────────────────────────────────────────────────────────
  // Paystack fires when a transfer is confirmed by the bank.
  if (eventName === "transfer.success" && data) {
    const transferCode = data.transfer_code as string | undefined;
    if (transferCode) {
      await supabase
        .from("creator_payouts")
        .update({ status: "success", settled_at: new Date().toISOString() })
        .eq("paystack_transfer_code", transferCode);
    }
    return new Response("OK", { status: 200 });
  }

  // ── transfer.failed ───────────────────────────────────────────────────────────
  if (eventName === "transfer.failed" && data) {
    const transferCode = data.transfer_code as string | undefined;
    const reason = (data.reason ?? data.failure_reason ?? "Transfer failed") as string;
    if (transferCode) {
      await supabase
        .from("creator_payouts")
        .update({ status: "failed", failure_reason: reason })
        .eq("paystack_transfer_code", transferCode);
    }
    return new Response("OK", { status: 200 });
  }

  // ── transfer.reversed ────────────────────────────────────────────────────────
  if (eventName === "transfer.reversed" && data) {
    const transferCode = data.transfer_code as string | undefined;
    if (transferCode) {
      await supabase
        .from("creator_payouts")
        .update({ status: "reversed" })
        .eq("paystack_transfer_code", transferCode);
    }
    return new Response("OK", { status: 200 });
  }

  // All other events — return 200 so Paystack doesn't retry.
  return new Response("OK", { status: 200 });
}

