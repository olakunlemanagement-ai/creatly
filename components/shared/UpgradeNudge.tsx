"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface Props {
  userId: string | null | undefined;
}

// Shown when the user has no active subscription.
// Dismissed state is session-only (sessionStorage) — DB is always the source of truth.
export function UpgradeNudge({ userId }: Props) {
  const sub = useSubscription(userId);

  if (sub.loading || sub.isActive) return null;

  return (
    <Link
      href="/pricing"
      className="flex items-center gap-1.5 rounded-full border border-terracotta-500/40 bg-terracotta-500/10 px-3 py-1 text-xs font-semibold text-terracotta-500 transition-colors hover:bg-terracotta-500/20"
    >
      <Crown className="h-3.5 w-3.5" />
      Free plan · Upgrade →
    </Link>
  );
}
