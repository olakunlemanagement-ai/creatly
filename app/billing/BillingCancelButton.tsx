"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  periodEnd: string | null;
}

export function BillingCancelButton({ periodEnd }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const router = useRouter();

  const endDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "the end of your billing period";

  async function handleCancel() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const data = (await res.json()) as { ok: boolean; error?: { message: string } };

    if (data.ok) {
      router.refresh(); // re-render server component to show cancel_at banner
    } else {
      setError(data.error?.message ?? "Could not cancel. Please try again.");
      setLoading(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
        <h3 className="font-display text-lg font-bold text-foreground">Cancel subscription?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ll keep full access until <strong>{endDate}</strong>. After that, downloads will be
          paused until you resubscribe.
        </p>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            Keep subscription
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
