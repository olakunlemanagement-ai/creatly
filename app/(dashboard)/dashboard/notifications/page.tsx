import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "./NotificationList";
import type { Notification } from "@/types/database";

export const metadata: Metadata = {
  title: `Notifications — ${APP_NAME}`,
};

const PAGE_SIZE = 20;

interface SearchParams {
  page?: string;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/notifications");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ data: notifications, count }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<Notification[]>(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .eq("is_read", false),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            Notifications
          </h1>
          {(unreadCount ?? 0) > 0 && (
            <span className="rounded-full bg-terracotta-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/notifications/preferences"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Manage preferences →
        </Link>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Bell className="size-10 text-muted-foreground/40" strokeWidth={1} />
          <p className="text-base text-muted-foreground">You&apos;re all caught up.</p>
        </div>
      ) : (
        <>
          <NotificationList
            notifications={notifications}
            unreadCount={unreadCount ?? 0}
          />

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/notifications?page=${page - 1}`}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/notifications?page=${page + 1}`}
                  className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
