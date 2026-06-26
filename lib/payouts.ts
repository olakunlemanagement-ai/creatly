// Creator payout execution via Paystack Transfer API.
// All amounts in integer kobo. Called by the admin API endpoint only.

import { createAdminClient } from "@/lib/supabase/admin";
import { PAYOUT_THRESHOLD_KOBO } from "@/lib/earnings";
import { env } from "@/lib/env";

export type PayoutSummary = {
  month: string;
  processed: number;
  skipped: number;
  total_kobo: number;
  errors: string[];
};

type PaystackRecipientResponse = {
  status: boolean;
  data?: { recipient_code: string };
  message?: string;
};

type PaystackTransferResponse = {
  status: boolean;
  data?: { transfer_code: string; status: string };
  message?: string;
};

// Create a Paystack transfer recipient for a bank account.
async function createRecipient(
  accountName: string,
  accountNumber: string,
  bankCode: string,
): Promise<string> {
  const res = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackRecipientResponse;
  if (!json.status || !json.data?.recipient_code) {
    throw new Error(`Paystack recipient creation failed: ${json.message ?? "unknown error"}`);
  }
  return json.data.recipient_code;
}

// Initiate a Paystack transfer.
async function initiateTransfer(
  recipientCode: string,
  amountKobo: number,
  reference: string,
  reason: string,
): Promise<{ transfer_code: string; status: string }> {
  const res = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountKobo,
      recipient: recipientCode,
      reason,
      reference,
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackTransferResponse;
  if (!json.status || !json.data) {
    throw new Error(`Paystack transfer failed: ${json.message ?? "unknown error"}`);
  }
  return { transfer_code: json.data.transfer_code, status: json.data.status };
}

// Process payouts for all creators with pending earnings >= PAYOUT_THRESHOLD_KOBO.
// Idempotent — already-paid earnings are skipped.
// NOTE: Paystack Transfers must be enabled on the account (Settings → Transfers).
export async function processPayouts(month: string): Promise<PayoutSummary> {
  const admin = createAdminClient();
  const summary: PayoutSummary = { month, processed: 0, skipped: 0, total_kobo: 0, errors: [] };

  // Fetch all pending earnings for this month
  const { data: earnings, error: earningsErr } = await admin
    .from("creator_earnings")
    .select("id, creator_id, earnings_kobo, status")
    .eq("period_month", month)
    .eq("status", "pending");

  if (earningsErr) throw new Error(`Failed to fetch creator_earnings: ${earningsErr.message}`);
  if (!earnings || earnings.length === 0) return summary;

  for (const earning of earnings) {
    // Also sum any carried_over earnings from previous months for this creator
    const { data: carryOver } = await admin
      .from("creator_earnings")
      .select("id, earnings_kobo, period_month")
      .eq("creator_id", earning.creator_id)
      .eq("status", "carried_over");

    const carryTotal = (carryOver ?? []).reduce((s, r) => s + r.earnings_kobo, 0);
    const totalDue = earning.earnings_kobo + carryTotal;

    // Skip if below threshold
    if (totalDue < PAYOUT_THRESHOLD_KOBO) {
      // Mark this month's earning as carried_over
      await admin
        .from("creator_earnings")
        .update({ status: "carried_over" })
        .eq("id", earning.id);
      summary.skipped++;
      continue;
    }

    // Get creator's default bank account
    const { data: bankAccount } = await admin
      .from("creator_bank_accounts")
      .select("id, account_name, account_number, bank_code")
      .eq("creator_id", earning.creator_id)
      .eq("is_default", true)
      .maybeSingle();

    if (!bankAccount) {
      console.warn(`[payouts] creator ${earning.creator_id} has no bank account — skipping`);
      summary.skipped++;
      continue;
    }

    const allEarningIds = [earning.id, ...(carryOver ?? []).map((r) => r.id)];
    const allPeriodMonths = [month, ...(carryOver ?? []).map((r) => r.period_month)];
    const reference = crypto.randomUUID();

    try {
      // Create recipient
      const recipientCode = await createRecipient(
        bankAccount.account_name,
        bankAccount.account_number,
        bankAccount.bank_code,
      );

      // Insert payout record BEFORE initiating transfer (idempotency)
      const { data: payout, error: payoutErr } = await admin
        .from("creator_payouts")
        .insert({
          creator_id: earning.creator_id,
          bank_account_id: bankAccount.id,
          amount_kobo: totalDue,
          paystack_recipient_code: recipientCode,
          status: "pending" as const,
          period_months: allPeriodMonths,
        })
        .select("id")
        .single();

      if (payoutErr || !payout) {
        summary.errors.push(`Creator ${earning.creator_id}: failed to insert payout row`);
        continue;
      }

      // Initiate transfer
      const { transfer_code } = await initiateTransfer(
        recipientCode,
        totalDue,
        reference,
        `Creatly creator earnings ${month}`,
      );

      // Update payout with transfer code
      await admin
        .from("creator_payouts")
        .update({ paystack_transfer_code: transfer_code })
        .eq("id", payout.id);

      // Mark all covered earnings as paid
      await admin
        .from("creator_earnings")
        .update({ status: "paid" })
        .in("id", allEarningIds);

      summary.processed++;
      summary.total_kobo += totalDue;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[payouts] creator ${earning.creator_id}:`, msg);
      summary.errors.push(`Creator ${earning.creator_id}: ${msg}`);
      // Mark as carried_over so it's retried next month
      await admin
        .from("creator_earnings")
        .update({ status: "carried_over" })
        .eq("id", earning.id);
    }
  }

  return summary;
}
