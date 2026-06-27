import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import EarningsClient from "./EarningsClient";

export const metadata: Metadata = { title: `Earnings — ${APP_NAME} Admin` };

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth();

  const admin = createAdminClient();

  // Fetch earnings rows for the selected month, joined with creator_profiles for names
  const { data: earnings } = await admin
    .from("creator_earnings")
    .select("id, creator_id, download_count, earnings_kobo, status")
    .eq("period_month", month)
    .order("earnings_kobo", { ascending: false });

  // Enrich with creator display names
  const rows = await Promise.all(
    (earnings ?? []).map(async (e) => {
      const { data: cp } = await admin
        .from("creator_profiles")
        .select("display_name, handle")
        .eq("user_id", e.creator_id)
        .maybeSingle();
      return {
        ...e,
        creator_name: cp?.display_name ?? null,
        creator_handle: cp?.handle ?? null,
      };
    }),
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
          {"// ADMIN"}
        </p>
        <h1 className="text-2xl font-bold font-display">Creator Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Calculate monthly earnings and trigger payouts. All amounts in NGN.
        </p>
      </div>

      <EarningsClient initialMonth={month} rows={rows} />
    </div>
  );
}
