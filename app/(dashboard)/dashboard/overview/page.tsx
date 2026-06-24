import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Download, Heart, ArrowRight, Upload, CreditCard, BookOpen } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: `Overview — ${APP_NAME}`,
};

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatPeriodEnd(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardOverviewPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/overview");

  const supabase = await createClient();

  const [
    { data: sub },
    { data: recentDownloadRows },
    { data: recentFavouriteRows },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, plan_type, current_period_end, cancel_at, max_seats")
      .eq("owner_id", auth.user.id)
      .in("status", ["active", "past_due", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("downloads")
      .select("resource_id, downloaded_at")
      .eq("user_id", auth.user.id)
      .order("downloaded_at", { ascending: false })
      .limit(4),
    supabase
      .from("favourites")
      .select("resource_id")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  // Fetch resource details for recent downloads
  const downloadResourceIds = (recentDownloadRows ?? []).map((d) => d.resource_id);
  const favouriteResourceIds = (recentFavouriteRows ?? []).map((f) => f.resource_id);
  const allResourceIds = [...new Set([...downloadResourceIds, ...favouriteResourceIds])];

  let resourceMap = new Map<string, ResourceCardData>();
  if (allResourceIds.length > 0) {
    const { data: resources } = await supabase
      .from("resources")
      .select("*, creators(name), categories(name, slug)")
      .eq("status", "published")
      .in("id", allResourceIds);
    resourceMap = new Map((resources ?? []).map((r) => [r.id, r as ResourceCardData]));
  }

  const downloadResources = downloadResourceIds
    .map((id) => resourceMap.get(id))
    .filter((r): r is ResourceCardData => r !== undefined);

  const favouriteResources = favouriteResourceIds
    .map((id) => resourceMap.get(id))
    .filter((r): r is ResourceCardData => r !== undefined);

  const favouritedSet = new Set(favouriteResourceIds);

  const greeting = timeGreeting();
  const displayName = auth.profile.full_name ?? auth.user.email;

  const planLabel =
    sub?.plan_type && sub.plan_type in PLANS
      ? PLANS[sub.plan_type as keyof typeof PLANS]?.label ?? sub.plan_type
      : null;
  const periodEnd = formatPeriodEnd(sub?.current_period_end ?? null);
  const isCancelling = !!sub?.cancel_at;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          {greeting}, {displayName}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to your dashboard.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscription card */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subscription
          </p>
          {sub?.status === "active" ? (
            <>
              <p className="font-heading text-lg font-semibold text-foreground">
                {planLabel ?? sub.plan_type}
              </p>
              {isCancelling ? (
                <p className="mt-1 text-sm text-amber-600">
                  Cancels on {formatPeriodEnd(sub.cancel_at ?? null)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Renews {periodEnd}
                </p>
              )}
              <Link
                href="/billing"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-green-700 hover:text-brand-green-800"
              >
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : sub?.status === "past_due" ? (
            <>
              <p className="font-heading text-lg font-semibold text-amber-600">Payment overdue</p>
              <p className="mt-1 text-sm text-muted-foreground">Update payment to restore access.</p>
              <Link
                href="/billing"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-terracotta-500 hover:text-terracotta-600"
              >
                Fix now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <>
              <p className="font-heading text-lg font-semibold text-foreground">Free plan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Subscribe to download unlimited resources.
              </p>
              <Link
                href="/pricing"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-terracotta-500 hover:text-terracotta-600"
              >
                Upgrade <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick actions
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link
              href="/browse"
              className="flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-sm font-medium text-foreground transition-colors hover:border-brand-green-700/40 hover:bg-brand-green-700/5"
            >
              <BookOpen className="h-5 w-5 text-brand-green-700" />
              Browse resources
            </Link>
            <Link
              href="/billing"
              className="flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-sm font-medium text-foreground transition-colors hover:border-brand-green-700/40 hover:bg-brand-green-700/5"
            >
              <CreditCard className="h-5 w-5 text-brand-green-700" />
              {sub?.status === "active" ? "Manage subscription" : "View plans"}
            </Link>
            {auth.profile.role === "creator" && (
              <Link
                href="/creator/upload"
                className="flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-sm font-medium text-foreground transition-colors hover:border-terracotta-500/40 hover:bg-terracotta-500/5"
              >
                <Upload className="h-5 w-5 text-terracotta-500" />
                Upload asset
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent downloads */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Recent downloads
            </h2>
          </div>
          {downloadResources.length > 0 && (
            <Link
              href="/dashboard/downloads"
              className="text-sm text-brand-green-700 hover:text-brand-green-800"
            >
              View all →
            </Link>
          )}
        </div>

        {downloadResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No downloads yet.</p>
            <Link href="/browse" className="mt-2 inline-block text-sm font-medium text-brand-green-700 hover:text-brand-green-800">
              Browse the library →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {downloadResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isFavourited={favouritedSet.has(resource.id)}
                userId={auth.user.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Saved favourites */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Saved favourites
            </h2>
          </div>
          {favouriteResources.length > 0 && (
            <Link
              href="/dashboard/favourites"
              className="text-sm text-brand-green-700 hover:text-brand-green-800"
            >
              View all →
            </Link>
          )}
        </div>

        {favouriteResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
            <Link href="/browse" className="mt-2 inline-block text-sm font-medium text-brand-green-700 hover:text-brand-green-800">
              Browse the library →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {favouriteResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isFavourited={favouritedSet.has(resource.id)}
                userId={auth.user.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
