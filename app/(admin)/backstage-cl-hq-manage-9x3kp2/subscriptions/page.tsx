import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";
import { CreditCard, Users, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: `Subscriptions — ${APP_NAME} Admin`,
};

const PAGE_SIZE = 30;

interface SearchParams {
  status?: string;
  plan?: string;
  q?: string;
  page?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "past_due", label: "Past due" },
  { value: "incomplete", label: "Incomplete" },
];

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const planFilter = sp.plan ?? "";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Summary cards — always without text search for accurate totals
  const [
    { count: activeCount },
    { count: cancelledCount },
    { count: pastDueCount },
  ] = await Promise.all([
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "past_due"),
  ]);

  // Main query
  let query = supabase
    .from("subscriptions")
    .select(
      `id, plan_id, plan_type, status, paystack_sub_code, current_period_end, cancel_at, created_at, kobo,
       profiles!subscriptions_owner_id_fkey(full_name, email)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (planFilter) query = query.eq("plan_id", planFilter);

  const { data: rawRows, count: totalCount } = await query;

  type SubRow = {
    id: string;
    plan_id: string | null;
    plan_type: string | null;
    status: string;
    paystack_sub_code: string | null;
    current_period_end: string | null;
    cancel_at: string | null;
    created_at: string | null;
    kobo: number | null;
    profiles: { full_name: string | null; email: string } | null;
  };

  const rows = (rawRows ?? []) as unknown as SubRow[];

  const filteredRows = q
    ? rows.filter((r) => {
        const email = r.profiles?.email ?? "";
        const name = r.profiles?.full_name ?? "";
        const lq = q.toLowerCase();
        return email.toLowerCase().includes(lq) || name.toLowerCase().includes(lq);
      })
    : rows;

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
      : "—";

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      cancelled: "bg-muted text-muted-foreground",
      past_due: "bg-amber-100 text-amber-700",
      incomplete: "bg-blue-100 text-blue-700",
    };
    return map[s] ?? "bg-muted text-muted-foreground";
  };

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      ...(status && { status }),
      ...(planFilter && { plan: planFilter }),
      ...(q && { q }),
      page: "1",
      ...overrides,
    });
    return `/backstage-cl-hq-manage-9x3kp2/subscriptions?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-semibold text-foreground">Subscriptions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {(totalCount ?? 0).toLocaleString()} total subscription records
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-brand-green-200 bg-brand-green-50/60 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-100">
            <CreditCard className="h-4 w-4 text-brand-green-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{(activeCount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{(cancelledCount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Cancelled</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{(pastDueCount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Past due</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 flex flex-wrap gap-3">
        <form method="GET" action="/backstage-cl-hq-manage-9x3kp2/subscriptions" className="flex-1 min-w-48">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search email or name…"
            className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {planFilter && <input type="hidden" name="plan" value={planFilter} />}
        </form>

        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={buildUrl({ status: opt.value })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === opt.value
                  ? "border-brand-green-700 bg-brand-green-700 text-white"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Renews / Cancelled</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((sub) => (
                  <tr key={sub.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{sub.profiles?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{sub.profiles?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground">{sub.plan_id ?? sub.plan_type ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(sub.status)}`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                      {sub.kobo ? formatNaira(sub.kobo) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {sub.cancel_at ? (
                        <span className="text-amber-600">Cancels {fmt(sub.cancel_at)}</span>
                      ) : (
                        fmt(sub.current_period_end)
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {fmt(sub.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
