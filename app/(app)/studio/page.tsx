import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: `Studio — ${APP_NAME}` };

export default async function StudioOverviewPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const supabase = await createClient();

  // Look up the creator entity for this user
  const { data: creator } = await supabase
    .from("creators")
    .select("id, name")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  // Counts by review_status for this creator's resources
  const statusCounts: Record<string, number> = {
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  };

  if (creator) {
    const { data: counts } = await supabase
      .from("resources")
      .select("review_status")
      .eq("creator_id", creator.id)
      .returns<{ review_status: string }[]>();

    if (counts) {
      for (const row of counts) {
        statusCounts[row.review_status] = (statusCounts[row.review_status] ?? 0) + 1;
      }
    }
  }

  // Total downloads for this creator's resources
  let totalDownloads = 0;
  if (creator) {
    const { count } = await supabase
      .from("downloads")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creator.id);
    totalDownloads = count ?? 0;
  }

  const STAT_CARDS = [
    { label: "Draft", value: statusCounts.draft, href: "/studio/assets?status=draft", color: "text-muted-foreground" },
    { label: "Submitted", value: statusCounts.submitted, href: "/studio/assets?status=submitted", color: "text-amber-600" },
    { label: "Published", value: statusCounts.approved, href: "/studio/assets?status=approved", color: "text-brand-green-600" },
    { label: "Rejected", value: statusCounts.rejected, href: "/studio/assets?status=rejected", color: "text-destructive" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"// Overview"}
        </p>
        <h1
          className="mt-2 font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {creator ? `Welcome back, ${creator.name}` : "Your Studio"}
        </h1>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map(({ label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Downloads */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Total downloads
        </p>
        <p className="mt-2 text-4xl font-bold text-foreground">{totalDownloads.toLocaleString()}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Across all your published assets
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/studio/upload"
          className="rounded-xl bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
        >
          Upload new asset →
        </Link>
        <Link
          href="/studio/assets"
          className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/30"
        >
          Manage assets
        </Link>
      </div>
    </div>
  );
}
