"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Download, CreditCard, Users, Info, CheckCircle2 } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import type { Notification } from "@/types/database";

function typeIcon(type: string) {
  switch (type) {
    case "download":      return <Download className="h-4 w-4 text-brand-green-700" />;
    case "subscription":  return <CreditCard className="h-4 w-4 text-terracotta-500" />;
    case "team":          return <Users className="h-4 w-4 text-brand-green-700" />;
    case "payment":       return <CreditCard className="h-4 w-4 text-destructive" />;
    default:              return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function NotificationContent({ n }: { n: Notification }) {
  return (
    <>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {typeIcon(n.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
            }`}
          >
            {n.title}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {!n.is_read && (
              <span className="h-2 w-2 rounded-full bg-terracotta-500" />
            )}
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {relativeTime(n.created_at)}
            </span>
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
      </div>
    </>
  );
}

interface Props {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationList({ notifications, unreadCount }: Props) {
  const [, startTransition] = useTransition();

  function handleRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  const rowClass = (n: Notification) =>
    `flex gap-4 px-4 py-4 transition-colors sm:px-5 ${
      !n.is_read ? "bg-brand-green-700/5" : ""
    }`;

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-green-700 hover:text-brand-green-800"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="divide-y divide-border rounded-2xl border border-border">
        {notifications.map((n) =>
          n.action_url ? (
            <Link
              key={n.id}
              href={n.action_url}
              className={`${rowClass(n)} cursor-pointer hover:bg-muted/40`}
              onClick={() => { if (!n.is_read) handleRead(n.id); }}
            >
              <NotificationContent n={n} />
            </Link>
          ) : (
            <div
              key={n.id}
              className={`${rowClass(n)} ${!n.is_read ? "cursor-pointer" : ""}`}
              onClick={!n.is_read ? () => handleRead(n.id) : undefined}
              role={!n.is_read ? "button" : undefined}
            >
              <NotificationContent n={n} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
