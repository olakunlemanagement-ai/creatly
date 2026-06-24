"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
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
      className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
    >
      <Zap className="h-3 w-3" />
      Free plan · Upgrade →
    </Link>
  );
}
