"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { ChevronLeft, ChevronRight, Calculator, Banknote, AlertCircle, CheckCircle } from "lucide-react";

type EarningsRow = {
  id: string;
  creator_id: string;
  creator_name: string | null;
  creator_handle: string | null;
  download_count: number;
  earnings_kobo: number;
  status: string;
};

type Props = {
  initialMonth: string;
  rows: EarningsRow[];
};

function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y!, mo! - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y!, mo! - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  carried_over: "bg-blue-100 text-blue-700",
};

export default function EarningsClient({ initialMonth, rows: initialRows }: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [rows, setRows] = useState<EarningsRow[]>(initialRows);
  const [calcStatus, setCalcStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [payStatus, setPayStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isCalcPending, startCalc] = useTransition();
  const [isPayPending, startPay] = useTransition();

  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const canGoForward = month < currentMonth;

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    setCalcStatus(null);
    setPayStatus(null);
    // Re-fetch rows for new month by navigating (server component will re-render)
    window.location.href = `/admin/earnings?month=${newMonth}`;
  }

  function handleCalculate() {
    setCalcStatus(null);
    startCalc(async () => {
      const res = await fetch("/api/admin/calculate-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        creators_processed?: number;
        distributed?: string;
        revenue_pool?: string;
      };
      if (!res.ok || !json.ok) {
        setCalcStatus({ ok: false, message: json.error ?? "Calculation failed." });
        return;
      }
      setCalcStatus({
        ok: true,
        message: `Calculated ${month}: ${json.creators_processed} creators, ${json.distributed} distributed of ${json.revenue_pool} pool.`,
      });
      // Reload to refresh rows
      window.location.reload();
    });
  }

  function handleProcessPayouts() {
    setPayStatus(null);
    startPay(async () => {
      const res = await fetch("/api/admin/process-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        processed?: number;
        skipped?: number;
        total?: string;
      };
      if (!res.ok || !json.ok) {
        setPayStatus({ ok: false, message: json.error ?? "Payout processing failed." });
        return;
      }
      setPayStatus({
        ok: true,
        message: `Processed ${json.processed} payouts (${json.total} total). ${json.skipped} skipped.`,
      });
      window.location.reload();
    });
  }

  const totalEarned = rows.reduce((s, r) => s + r.earnings_kobo, 0);

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleMonthChange(prevMonth(month))}
          className="rounded-lg border p-2 hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-mono text-sm font-semibold w-20 text-center">{month}</span>
        <button
          onClick={() => canGoForward ? handleMonthChange(nextMonth(month)) : undefined}
          disabled={!canGoForward}
          className="rounded-lg border p-2 hover:bg-muted transition-colors disabled:opacity-40"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleCalculate}
          disabled={isCalcPending || isPayPending}
          variant="outline"
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          {isCalcPending ? "Calculating…" : "Calculate earnings"}
        </Button>
        <Button
          onClick={handleProcessPayouts}
          disabled={isPayPending || isCalcPending || rows.length === 0}
          className="gap-2"
        >
          <Banknote className="h-4 w-4" />
          {isPayPending ? "Processing…" : "Process payouts"}
        </Button>
      </div>

      {/* Status messages */}
      {calcStatus && (
        <div
          className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
            calcStatus.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {calcStatus.ok ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{calcStatus.message}</span>
        </div>
      )}
      {payStatus && (
        <div
          className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
            payStatus.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {payStatus.ok ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{payStatus.message}</span>
        </div>
      )}

      {/* Summary stat */}
      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {rows.length} creator{rows.length !== 1 ? "s" : ""} ·{" "}
          {formatNaira(totalEarned)} total
        </p>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No earnings for {month} yet. Click &quot;Calculate earnings&quot; to compute.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creator</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Downloads</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Earnings</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium">{row.creator_name ?? "Unknown"}</span>
                    {row.creator_handle && (
                      <span className="ml-2 text-xs text-muted-foreground">@{row.creator_handle}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.download_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatNaira(row.earnings_kobo)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[row.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
