import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Users, FileBox, UserCheck } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Analytics — ${APP_NAME} Admin`,
};

interface SearchParams { month?: string }

function parseMonth(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (y && m && m >= 1 && m <= 12) return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function prevMonth(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { year, month } = parseMonth(sp.month);

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
  const monthEndDate = new Date(Date.UTC(year, month, 1));
  const monthEnd = monthEndDate.toISOString();

  const prevMonthEnd = new Date(Date.UTC(year, month - 1, 1));
  const prevMonthStart = new Date(Date.UTC(year, month - 2, 1));
  const prevStart = prevMonthStart.toISOString();
  const prevEnd = prevMonthEnd.toISOString();

  const supabase = await createClient();

  const [
    { count: totalResources },
    { count: totalCreators },
    { count: totalUsers },
    { count: totalDownloads },
    { count: newUsersThisMonth },
    { count: downloadsThisMonth },
    { count: downloadsPrevMonth },
    { count: activeSubscribers },
    { data: topResourcesRaw },
    { data: topCategoriesRaw },
  ] = await Promise.all([
    // Totals (all-time)
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("creators").select("id", { count: "exact", head: true }).eq("is_public", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("downloads").select("id", { count: "exact", head: true }),

    // New users this month
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd),

    // Downloads this month
    supabase
      .from("downloads")
      .select("id", { count: "exact", head: true })
      .gte("downloaded_at", monthStart)
      .lt("downloaded_at", monthEnd),

    // Downloads previous month
    supabase
      .from("downloads")
      .select("id", { count: "exact", head: true })
      .gte("downloaded_at", prevStart)
      .lt("downloaded_at", prevEnd),

    // Active subscribers
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    // Top 10 resources by download count
    supabase
      .from("resources")
      .select("id, title, slug, download_count, creators(name)")
      .eq("status", "published")
      .order("download_count", { ascending: false })
      .limit(10),

    // Top 5 categories — use download_count aggregate via resources join
    supabase
      .from("categories")
      .select("id, name, slug, resources(download_count)")
      .eq("is_active", true)
      .limit(20),
  ]);

  // Compute top categories from aggregated resource download counts
  const categoryTotals = (topCategoriesRaw ?? [])
    .map((cat) => {
      type CatRow = typeof cat & { resources: { download_count: number }[] };
      const c = cat as CatRow;
      const total = (c.resources ?? []).reduce((sum, r) => sum + (r.download_count ?? 0), 0);
      return { id: c.id, name: c.name, slug: c.slug, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxCategoryTotal = Math.max(1, categoryTotals[0]?.total ?? 1);

  type TopResource = {
    id: string;
    title: string;
    slug: string;
    download_count: number;
    creators: { name: string }[] | null;
  };
  const topResources = (topResourcesRaw ?? []) as unknown as TopResource[];
  const maxResourceDownloads = Math.max(1, topResources[0]?.download_count ?? 1);

  const downloadDelta = (downloadsThisMonth ?? 0) - (downloadsPrevMonth ?? 0);
  const downloadDeltaSign = downloadDelta >= 0 ? "+" : "";
  const freeUsers = Math.max(0, (totalUsers ?? 0) - (activeSubscribers ?? 0));

  const statCards = [
    { label: "Published resources", value: totalResources ?? 0, icon: FileBox, color: "text-brand-green-700" },
    { label: "Active creators", value: totalCreators ?? 0, icon: Users, color: "text-brand-green-700" },
    { label: "Total users", value: totalUsers ?? 0, icon: UserCheck, color: "text-brand-green-700" },
    { label: "All-time downloads", value: totalDownloads ?? 0, icon: Download, color: "text-brand-green-700" },
  ];

  const prevMonthSlug = prevMonth(year, month);
  const nextMonthSlug = nextMonth(year, month);
  const currentMonthSlug = `${year}-${String(month).padStart(2, "0")}`;
  const nowSlug = (() => {
    const n = new Date();
    return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const isCurrentMonth = currentMonthSlug === nowSlug;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Analytics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">All data from the {APP_NAME} database.</p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
          <Link
            href={`/admin/analytics?month=${prevMonthSlug}`}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-32 text-center text-sm font-medium text-foreground">
            {monthLabel(year, month)}
          </span>
          <Link
            href={`/admin/analytics?month=${nextMonthSlug}`}
            className={`rounded-lg p-1 transition-colors ${isCurrentMonth ? "pointer-events-none text-muted-foreground/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Month metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Downloads this month</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{(downloadsThisMonth ?? 0).toLocaleString()}</p>
          <p className={`mt-1 text-sm font-medium ${downloadDelta >= 0 ? "text-green-600" : "text-destructive"}`}>
            {downloadDeltaSign}{downloadDelta.toLocaleString()} vs last month
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New users this month</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{(newUsersThisMonth ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscription breakdown</p>
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">Subscribers</span>
                <span className="text-foreground font-bold">{(activeSubscribers ?? 0).toLocaleString()}</span>
              </div>
              {(totalUsers ?? 0) > 0 && (
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-green-600 transition-all"
                    style={{ width: `${Math.min(100, ((activeSubscribers ?? 0) / (totalUsers ?? 1)) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Free users</span>
                <span className="text-muted-foreground font-medium">{freeUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 resources */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Top resources by downloads</h2>
          </div>
          <div className="divide-y divide-border">
            {topResources.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              topResources.map((r, idx) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/resources/${r.id}/edit`}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {r.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.creators?.[0]?.name ?? "—"}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-green-500"
                        style={{ width: `${Math.max(2, (r.download_count / maxResourceDownloads) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {r.download_count.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top 5 categories */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Top categories by downloads</h2>
          </div>
          <div className="divide-y divide-border">
            {categoryTotals.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              categoryTotals.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-terracotta-500"
                        style={{ width: `${Math.max(2, (cat.total / maxCategoryTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {cat.total.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
