import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Tag,
  FileBox,
  ClipboardList,
  Download,
  CreditCard,
  TrendingUp,
  UserX,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Admin Overview — ${APP_NAME}`,
};

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href?: string;
  accent?: boolean;
  alert?: boolean;
};

function StatCard({ label, value, icon: Icon, href, accent, alert }: StatCardProps) {
  const inner = (
    <div
      className={`group flex items-start gap-4 rounded-2xl border p-5 transition-shadow ${
        href ? "hover:shadow-md" : ""
      } ${alert ? "border-amber-200 bg-amber-50/60" : accent ? "border-brand-green-200 bg-brand-green-50/60" : "border-border bg-card"}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          alert ? "bg-amber-100" : accent ? "bg-brand-green-100" : "bg-muted"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            alert ? "text-amber-600" : accent ? "text-brand-green-700" : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </div>
      {href && (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

type RecentRow = {
  id: string;
  label: string;
  sub?: string;
  href?: string;
  time?: string | null;
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const now = new Date();
  const thisMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [
    { count: creatorCount },
    { count: categoryCount },
    { count: resourceCount },
    { count: submittedCount },
    { count: userCount },
    { count: activeSubCount },
    { count: inactiveSubCount },
    { count: totalDownloads },
    { count: downloadsThisMonth },
    { data: recentSubscriptions },
    { data: recentDownloads },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from("creators").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("review_status", "submitted"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("downloads").select("id", { count: "exact", head: true }),
    supabase.from("downloads").select("id", { count: "exact", head: true }).gte("downloaded_at", thisMonthStart),
    // Recent subscriptions — most recent 5
    supabase
      .from("subscriptions")
      .select("id, plan_id, status, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(5),
    // Recent downloads
    supabase
      .from("downloads")
      .select("id, downloaded_at, resources(title), profiles(full_name, email)")
      .order("downloaded_at", { ascending: false })
      .limit(5),
    // Recent signups
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
      : "—";

  type SubRow = {
    id: string;
    plan_id: string | null;
    status: string | null;
    created_at: string | null;
    profiles: { full_name: string | null; email: string } | null;
  };
  type DlRow = {
    id: string;
    downloaded_at: string | null;
    resources: { title: string } | null;
    profiles: { full_name: string | null; email: string } | null;
  };
  type SignupRow = {
    id: string;
    full_name: string | null;
    email: string;
    created_at: string | null;
  };

  const recentSubRows: RecentRow[] = ((recentSubscriptions ?? []) as unknown as SubRow[]).map((s) => ({
    id: s.id,
    label: s.profiles?.full_name ?? s.profiles?.email ?? "Unknown",
    sub: `${s.plan_id ?? "—"} · ${s.status ?? "—"}`,
    time: fmt(s.created_at),
  }));

  const recentDlRows: RecentRow[] = ((recentDownloads ?? []) as unknown as DlRow[]).map((d) => ({
    id: d.id,
    label: d.resources?.title ?? "Deleted resource",
    sub: d.profiles?.full_name ?? d.profiles?.email ?? "Unknown user",
    time: fmt(d.downloaded_at),
  }));

  const recentSignupRows: RecentRow[] = ((recentSignups ?? []) as unknown as SignupRow[]).map((p) => ({
    id: p.id,
    label: p.full_name ?? p.email,
    sub: p.email,
    href: `/backstage-cl-hq-manage-9x3kp2/users`,
    time: fmt(p.created_at),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Admin Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {APP_NAME} catalogue &amp; subscription metrics.
        </p>
      </div>

      {/* ── Catalogue stats ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Catalogue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Published resources" value={resourceCount ?? 0} icon={FileBox} href="/backstage-cl-hq-manage-9x3kp2/resources" accent />
          <StatCard label="Active creators" value={creatorCount ?? 0} icon={Users} href="/backstage-cl-hq-manage-9x3kp2/creators" accent />
          <StatCard label="Active categories" value={categoryCount ?? 0} icon={Tag} href="/backstage-cl-hq-manage-9x3kp2/categories" accent />
          <StatCard label="Pending review" value={submittedCount ?? 0} icon={ClipboardList} href="/backstage-cl-hq-manage-9x3kp2/review" alert={Boolean(submittedCount)} />
        </div>
      </section>

      {/* ── User & subscription stats ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Users &amp; subscriptions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={userCount ?? 0} icon={Users} href="/backstage-cl-hq-manage-9x3kp2/users" />
          <StatCard label="Active subscribers" value={activeSubCount ?? 0} icon={CreditCard} href="/backstage-cl-hq-manage-9x3kp2/subscriptions" accent />
          <StatCard label="Cancelled" value={inactiveSubCount ?? 0} icon={UserX} href="/backstage-cl-hq-manage-9x3kp2/subscriptions" />
          <StatCard label="Downloads this month" value={downloadsThisMonth ?? 0} icon={TrendingUp} href="/backstage-cl-hq-manage-9x3kp2/analytics" />
        </div>
      </section>

      {/* ── Downloads ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Downloads
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total all-time downloads" value={totalDownloads ?? 0} icon={Download} href="/backstage-cl-hq-manage-9x3kp2/analytics" />
        </div>
      </section>

      {/* ── Recent activity ── */}
      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <ActivityList title="Recent signups" rows={recentSignupRows} emptyText="No signups yet." />
        <ActivityList title="Recent subscriptions" rows={recentSubRows} emptyText="No subscriptions yet." />
        <ActivityList title="Recent downloads" rows={recentDlRows} emptyText="No downloads yet." />
      </section>

      {/* ── Quick actions ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/backstage-cl-hq-manage-9x3kp2/resources/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800"
          >
            Upload resource <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/backstage-cl-hq-manage-9x3kp2/creators/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Add creator
          </Link>
          <Link
            href="/backstage-cl-hq-manage-9x3kp2/categories/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Add category
          </Link>
          <Link
            href="/backstage-cl-hq-manage-9x3kp2/analytics"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Full analytics
          </Link>
        </div>
      </section>
    </div>
  );
}

function ActivityList({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: { id: string; label: string; sub?: string; href?: string; time?: string | null }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="divide-y divide-border">
        {rows.length === 0 ? (
          <li className="px-5 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.label}</p>
                {row.sub && (
                  <p className="truncate text-xs text-muted-foreground">{row.sub}</p>
                )}
              </div>
              {row.time && (
                <span className="shrink-0 text-xs text-muted-foreground">{row.time}</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
