"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface Props {
  userId: string | null | undefined;
}

// Shows a full-width banner when a prior subscription has lapsed.
// Dismissed state is session-only (sessionStorage) — DB drives visibility.
export function ExpiredBanner({ userId }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const sub = useSubscription(userId);

  // Only show if: loaded, specifically cancelled/expired (had a subscription before), and not dismissed
  if (sub.loading || sub.isActive || !sub.isCancelled || dismissed) return null;

  const expiredDate = sub.periodEnd
    ? new Date(sub.periodEnd).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative flex items-center justify-between gap-4 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p>
        Your subscription{expiredDate ? ` expired on ${expiredDate}` : " has ended"}.{" "}
        <Link href="/pricing" className="font-semibold underline">
          Renew to restore downloads →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
