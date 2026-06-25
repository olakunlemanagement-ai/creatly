import type { Metadata } from "next";
import Link from "next/link";
import { Users, Tag, FileBox, ClipboardList, BarChart3, ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `Admin Overview — ${APP_NAME}`,
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: creatorCount },
    { count: categoryCount },
    { count: resourceCount },
    { count: submittedCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("creators").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("review_status", "submitted"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      label: "Creators",
      value: creatorCount ?? 0,
      href: "/admin/creators",
      icon: Users,
      color: "text-brand-green-700",
    },
    {
      label: "Active categories",
      value: categoryCount ?? 0,
      href: "/admin/categories",
      icon: Tag,
      color: "text-brand-green-700",
    },
    {
      label: "Published resources",
      value: resourceCount ?? 0,
      href: "/admin/resources",
      icon: FileBox,
      color: "text-brand-green-700",
    },
    {
      label: "Pending review",
      value: submittedCount ?? 0,
      href: "/admin/review",
      icon: ClipboardList,
      color: submittedCount ? "text-terracotta-500" : "text-muted-foreground",
    },
    {
      label: "Total users",
      value: userCount ?? 0,
      href: "/admin/analytics",
      icon: BarChart3,
      color: "text-brand-green-700",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Admin Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {APP_NAME} catalogue management dashboard.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/resources/new"
            className="rounded-xl bg-brand-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800"
          >
            Upload resource
          </Link>
          <Link
            href="/admin/creators/new"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Add creator
          </Link>
          <Link
            href="/admin/categories/new"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Add category
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            View analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
