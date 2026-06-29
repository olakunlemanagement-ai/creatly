"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { clearRecentlyViewed } from "@/lib/actions/recently-viewed";

interface Props {
  userId: string;
}

export function ClearHistoryButton({ userId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    setLoading(true);
    await clearRecentlyViewed(userId);
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Clear all history?</span>
        <button
          onClick={handleClear}
          disabled={loading}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          {loading ? "Clearing…" : "Yes, clear"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-red-500"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Clear history
    </button>
  );
}
