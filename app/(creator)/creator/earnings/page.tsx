import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { PAYOUT_THRESHOLD_KOBO } from "@/lib/earnings";
import {
  TrendingUp,
  Download,
  Wallet,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = { title: `Earnings — ${APP_NAME}` };

const EARNINGS_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  carried_over: "bg-blue-100 text-blue-700",
};

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
};

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 space-y-3 ${
        accent ? "bg-primary/5 border-primary/20" : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <Icon
          className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
      <p className={`text-2xl font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function CreatorEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const PAGE_SIZE = 12;

  const supabase = await createClient();

  // All earnings for this creator, sorted newest first
  const { data: allEarnings } = await supabase
    .from("creator_earnings")
    .select("id, period_month, download_count, earnings_kobo, status, created_at")
    .eq("creator_id", auth.user.id)
    .order("period_month", { ascending: false });

  const earnings = allEarnings ?? [];

  // Summary stats
  const totalEarnedKobo = earnings
    .filter((e) => e.status === "paid")
    .reduce((s, e) => s + e.earnings_kobo, 0);

  const now = new Date();
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const thisMonthEarning = earnings.find((e) => e.period_month === thisMonth);
  const thisMonthKobo = thisMonthEarning?.earnings_kobo ?? 0;

  const pendingKobo = earnings
    .filter((e) => e.status === "pending" || e.status === "carried_over")
    .reduce((s, e) => s + e.earnings_kobo, 0);

  const totalDownloads = earnings.reduce((s, e) => s + e.download_count, 0);

  // Paginate earnings for the history table
  const totalCount = earnings.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageEarnings = earnings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Fetch associated payout records
  const { data: payouts } = await supabase
    .from("creator_payouts")
    .select("period_months, status, settled_at, amount_kobo")
    .eq("creator_id", auth.user.id)
    .order("initiated_at", { ascending: false });

  // Build a map: period_month → payout settled_at
  const payoutByMonth = new Map<string, { settled_at: string | null; status: string }>();
  for (const p of payouts ?? []) {
    for (const m of p.period_months ?? []) {
      if (!payoutByMonth.has(m)) {
        payoutByMonth.set(m, { settled_at: p.settled_at, status: p.status });
      }
    }
  }

  // Bank account
  const { data: bankAccount } = await supabase
    .from("creator_bank_accounts")
    .select("account_name, bank_name, account_number")
    .eq("creator_id", auth.user.id)
    .eq("is_default", true)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
          {"// CREATOR STUDIO"}
        </p>
        <h1 className="text-3xl font-bold font-display">Earnings</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Your download-based earnings and payout history.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total earned"
          value={formatNaira(totalEarnedKobo)}
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="This month"
          value={thisMonthKobo > 0 ? formatNaira(thisMonthKobo) : "—"}
          icon={Clock}
        />
        <StatCard
          label="Pending payout"
          value={pendingKobo > 0 ? formatNaira(pendingKobo) : "—"}
          icon={Wallet}
        />
        <StatCard
          label="Total downloads"
          value={totalDownloads.toLocaleString()}
          icon={Download}
        />
      </div>

      {/* Bank account section */}
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Bank account</h2>
          <Link
            href="/creator/payouts/bank-account"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {bankAccount ? "Update" : "Add account"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {bankAccount ? (
          <div className="space-y-1">
            <p className="font-medium text-foreground">{bankAccount.account_name}</p>
            <p className="text-sm text-muted-foreground">
              {bankAccount.bank_name} · ****{bankAccount.account_number.slice(-4)}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              Add a bank account to receive payouts. Without one, earnings will accumulate
              but cannot be transferred.
            </p>
          </div>
        )}
      </div>

      {/* Payout schedule info */}
      <div className="rounded-xl border bg-muted/30 p-5 space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Payout schedule:</span>{" "}
          Payouts are processed on the 1st of each month for the previous month&apos;s earnings.
        </p>
        <p>
          <span className="font-medium text-foreground">Minimum payout:</span>{" "}
          {formatNaira(PAYOUT_THRESHOLD_KOBO)}. Earnings below this carry over to the next month.
        </p>
      </div>

      {/* Earnings history */}
      <div className="space-y-4">
        <h2 className="font-semibold text-base">Earnings history</h2>

        {earnings.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No earnings yet. Earnings are calculated monthly based on downloads of your assets.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Month</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Downloads</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Earnings</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paid on</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageEarnings.map((e) => {
                    const payout = payoutByMonth.get(e.period_month);
                    return (
                      <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm">{e.period_month}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{e.download_count}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatNaira(e.earnings_kobo)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              EARNINGS_STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {e.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {payout?.settled_at
                            ? new Date(payout.settled_at).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{" "}
                  {totalCount}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/creator/earnings?page=${page - 1}`}
                      className="rounded-lg border px-3 py-1.5 hover:bg-muted transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/creator/earnings?page=${page + 1}`}
                      className="rounded-lg border px-3 py-1.5 hover:bg-muted transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
