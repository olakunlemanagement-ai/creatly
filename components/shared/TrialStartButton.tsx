"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export function TrialStartButton({ className, children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Could not start trial.");
        return;
      }
      // Refresh so the new entitlement takes effect
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleStart}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        }
      >
        <Zap className="h-4 w-4" />
        {loading ? "Starting trial…" : (children ?? "Start free trial →")}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
