"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/config";

interface Props {
  token: string;
  userEmail: string;
}

export function TeamAcceptClient({ token, userEmail }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAccept() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/teams/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = (await res.json()) as { ok: boolean; error?: { message: string } };

    if (data.ok) {
      router.push("/dashboard?joined_team=1");
    } else {
      setError(data.error?.message ?? "Could not accept the invite. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
          // TEAM INVITE
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          You've been invited to join a team on {APP_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accepting as <strong>{userEmail}</strong>. You'll get full download access as part of
          the team's subscription.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <a
          href="/"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Decline
        </a>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-6 py-3 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Joining…" : "Accept invite"}
        </button>
      </div>
    </div>
  );
}
