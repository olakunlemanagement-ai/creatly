// Creator earnings calculation — all arithmetic in integer kobo.
// Never use floats near money. Use Math.floor for division results.
// Called by the admin API endpoint; safe to re-run (idempotent via upsert).

import { createAdminClient } from "@/lib/supabase/admin";

const CREATOR_SHARE_PERCENT = 0.7; // 70% to creators
export const PAYOUT_THRESHOLD_KOBO = 500_000; // ₦5,000

export type EarningsSummary = {
  month: string;
  revenue_pool_kobo: number; // total platform subscription revenue for the month
  creator_pool_kobo: number; // 70% of revenue_pool
  total_downloads: number;
  creators_processed: number;
  total_distributed_kobo: number;
  platform_share_kobo: number;
};

type CreatorDownloadCount = {
  creator_id: string;
  download_count: number;
};

// Calculate and upsert creator_earnings rows for a given month ('YYYY-MM').
// Idempotent — safe to call multiple times for the same month.
export async function calculateMonthlyEarnings(
  month: string,
): Promise<EarningsSummary> {
  const admin = createAdminClient();

  // 1. Build month boundary timestamps
  const [year, mon] = month.split("-").map(Number);
  const periodStart = new Date(Date.UTC(year!, mon! - 1, 1));
  const periodEnd = new Date(Date.UTC(year!, mon!, 1)); // exclusive

  // 2. Sum subscription revenue collected this month from payment_references
  const { data: refs, error: refsErr } = await admin
    .from("payment_references")
    .select("kobo")
    .eq("status", "success")
    .gte("settled_at", periodStart.toISOString())
    .lt("settled_at", periodEnd.toISOString());

  if (refsErr) throw new Error(`Failed to fetch payment_references: ${refsErr.message}`);

  const revenue_pool_kobo = (refs ?? []).reduce((sum, r) => sum + (r.kobo ?? 0), 0);

  // 70% goes to creators; platform keeps 30%
  const creator_pool_kobo = Math.floor(revenue_pool_kobo * CREATOR_SHARE_PERCENT);

  // 3. Count downloads per creator in this month
  const { data: dlRows, error: dlErr } = await admin
    .from("downloads")
    .select("creator_id")
    .gte("created_at", periodStart.toISOString())
    .lt("created_at", periodEnd.toISOString());

  if (dlErr) throw new Error(`Failed to fetch downloads: ${dlErr.message}`);

  const dlArray = dlRows ?? [];
  const total_downloads = dlArray.length;

  // Aggregate by creator_id
  const countByCreator = dlArray.reduce<Record<string, number>>((acc, row) => {
    if (!row.creator_id) return acc;
    acc[row.creator_id] = (acc[row.creator_id] ?? 0) + 1;
    return acc;
  }, {});

  const creatorCounts: CreatorDownloadCount[] = Object.entries(countByCreator).map(
    ([creator_id, download_count]) => ({ creator_id, download_count }),
  );

  // 4. Compute each creator's proportional share (integer kobo, floor)
  let total_distributed_kobo = 0;

  if (creator_pool_kobo > 0 && total_downloads > 0) {
    const upserts = creatorCounts.map((c) => {
      const earnings_kobo = Math.floor(
        (c.download_count / total_downloads) * creator_pool_kobo,
      );
      total_distributed_kobo += earnings_kobo;
      return {
        creator_id: c.creator_id,
        period_month: month,
        download_count: c.download_count,
        total_downloads,
        revenue_pool_kobo: creator_pool_kobo,
        earnings_kobo,
        status: "pending" as const,
      };
    });

    if (upserts.length > 0) {
      const { error: upsertErr } = await admin
        .from("creator_earnings")
        .upsert(upserts, { onConflict: "creator_id,period_month" });

      if (upsertErr)
        throw new Error(`Failed to upsert creator_earnings: ${upsertErr.message}`);
    }
  }

  return {
    month,
    revenue_pool_kobo,
    creator_pool_kobo,
    total_downloads,
    creators_processed: creatorCounts.length,
    total_distributed_kobo,
    platform_share_kobo: revenue_pool_kobo - total_distributed_kobo,
  };
}
