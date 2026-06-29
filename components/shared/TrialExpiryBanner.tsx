"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface Props {
  userId: string | null | undefined;
}

export function TrialExpiryBanner({ userId }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const sub = useSubscription(userId);

  if (sub.loading || !sub.isActive || !sub.isTrial || dismissed) return null;

  // Only show within 2 days of expiry
  if (!sub.periodEnd) return null;
  const msLeft = new Date(sub.periodEnd).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  if (daysLeft > 2) return null;
  if (daysLeft <= 0) return null; // expired — ExpiredBanner handles that state

  const label =
    daysLeft === 1 ? "expires tomorrow" : `expires in ${daysLeft} days`;

  return (
    <div className="relative flex items-center justify-between gap-4 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-800">
      <p>
        Your free trial {label}.{" "}
        <Link href="/pricing" className="font-semibold underline">
          Subscribe to keep downloading →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-terracotta-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
