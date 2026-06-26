"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  verifyBankAccountSchema,
  saveBankAccountSchema,
} from "@/lib/validations/bank-account";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string };

// Resolve account name from Paystack /bank/resolve.
// Returns the account name on success.
export async function verifyBankAccount(
  input: z.infer<typeof verifyBankAccountSchema>,
): Promise<ActionResult<{ account_name: string }>> {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "You must be signed in." };
  if (auth.profile.role !== "creator")
    return { ok: false, error: "Only creators can add bank accounts." };

  // 2. VALIDATE
  const parsed = verifyBankAccountSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      ok: false,
      error: first?.message ?? "Invalid input.",
      field: first?.path[0]?.toString(),
    };
  }

  const { bank_code, account_number } = parsed.data;

  // 3. CALL PAYSTACK — server-side only
  const url = `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`;
  let paystackRes: Response;
  try {
    paystackRes = await fetch(url, {
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "Could not reach Paystack. Please try again." };
  }

  if (!paystackRes.ok) {
    return {
      ok: false,
      error: "Account not found. Please check your bank and account number.",
    };
  }

  const json = (await paystackRes.json()) as {
    status: boolean;
    data?: { account_name: string };
  };

  if (!json.status || !json.data?.account_name) {
    return {
      ok: false,
      error: "Could not verify account. Please check your details.",
    };
  }

  return { ok: true, data: { account_name: json.data.account_name } };
}

// Save a verified bank account to the DB.
// This replaces any existing default account for this creator.
export async function saveBankAccount(
  input: z.infer<typeof saveBankAccountSchema>,
): Promise<ActionResult> {
  // 1. AUTH
  const auth = await getAuthenticatedUser();
  if (!auth) return { ok: false, error: "You must be signed in." };
  if (auth.profile.role !== "creator")
    return { ok: false, error: "Only creators can add bank accounts." };

  // 2. VALIDATE
  const parsed = saveBankAccountSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      ok: false,
      error: first?.message ?? "Invalid input.",
      field: first?.path[0]?.toString(),
    };
  }

  const { bank_code, account_number, account_name, bank_name } = parsed.data;
  const supabase = await createClient();

  // 3. UPSERT — replace the existing default account (if any)
  // First clear any existing is_default flag, then insert the new one.
  await supabase
    .from("creator_bank_accounts")
    .update({ is_default: false })
    .eq("creator_id", auth.user.id);

  const { error } = await supabase.from("creator_bank_accounts").upsert(
    {
      creator_id: auth.user.id,
      bank_code,
      account_number,
      account_name,
      bank_name,
      is_default: true,
      verified_at: new Date().toISOString(),
    },
    { onConflict: "creator_id,account_number,bank_code" },
  );

  if (error) {
    return { ok: false, error: "Failed to save bank account. Please try again." };
  }

  return { ok: true };
}
