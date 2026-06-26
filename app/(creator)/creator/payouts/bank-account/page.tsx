import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { env } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, Building2 } from "lucide-react";
import BankAccountForm from "./BankAccountForm";

export const metadata: Metadata = { title: `Bank account — ${APP_NAME}` };

type PaystackBank = { code: string; name: string };

async function fetchBanks(): Promise<PaystackBank[]> {
  try {
    const res = await fetch(
      "https://api.paystack.co/bank?currency=NGN&use_cursor=false&perPage=100",
      {
        headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
        next: { revalidate: 3600 }, // cache for 1 hour — bank list rarely changes
      },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { status: boolean; data?: PaystackBank[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function BankAccountPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const [banks, supabase] = await Promise.all([fetchBanks(), createClient()]);

  const { data: existing } = await supabase
    .from("creator_bank_accounts")
    .select("account_name, bank_name, account_number")
    .eq("creator_id", auth.user.id)
    .eq("is_default", true)
    .maybeSingle();

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-8">
      {/* Back */}
      <Link
        href="/creator/earnings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to earnings
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold font-display">Bank account</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Add a Nigerian bank account to receive your monthly payouts.
        </p>
      </div>

      {/* Existing account */}
      {existing && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {"// CURRENT ACCOUNT"}
          </p>
          <p className="font-semibold text-foreground">{existing.account_name}</p>
          <p className="text-sm text-muted-foreground">
            {existing.bank_name} · ****{existing.account_number.slice(-4)}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="rounded-xl border p-6 space-y-4">
        <p className="text-sm font-medium text-foreground">
          {existing ? "Update bank account" : "Add bank account"}
        </p>
        {banks.length === 0 ? (
          <p className="text-sm text-destructive">
            Could not load the bank list. Please refresh and try again.
          </p>
        ) : (
          <BankAccountForm banks={banks} />
        )}
      </div>
    </div>
  );
}
