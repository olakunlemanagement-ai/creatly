"use client";

import { useState, useTransition } from "react";
import { Users, Mail, Trash2, Loader2 } from "lucide-react";
import type { TeamMemberRow, PendingInviteRow } from "./page";

interface Props {
  teamName: string;
  teamId: string;
  subscriptionId: string;
  maxSeats: number;
  currentUserId: string;
  members: TeamMemberRow[];
  pendingInvites: PendingInviteRow[];
}

export function TeamDashboardClient({
  teamName,
  maxSeats,
  currentUserId,
  members: initialMembers,
  pendingInvites: initialInvites,
}: Props) {
  const [members, setMembers]   = useState(initialMembers);
  const [invites, setInvites]   = useState(initialInvites);
  const [email, setEmail]       = useState("");
  const [inviteError, setInviteError]   = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const seatsUsed = members.length;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);

    startTransition(async () => {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok: boolean; error?: { message: string } };

      if (data.ok) {
        setInviteSuccess(true);
        setEmail("");
        setInvites((prev) => [
          { id: "pending", email, expires_at: "", created_at: new Date().toISOString() },
          ...prev,
        ]);
      } else {
        setInviteError(data.error?.message ?? "Could not send invite.");
      }
    });
  }

  async function handleRemove(memberId: string) {
    const res = await fetch("/api/teams/remove-member", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    const data = (await res.json()) as { ok: boolean; error?: { message: string } };

    if (data.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{teamName}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {seatsUsed} / {maxSeats} seats used
        </div>
      </div>

      {/* Member list */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Members
        </h2>
        <div className="divide-y divide-border rounded-xl border border-border">
          {members.map((m) => {
            const name = m.profiles?.full_name ?? m.profiles?.email ?? "Unknown";
            const memberEmail = m.profiles?.email ?? "";
            const isOwner = m.role === "owner" || m.profile_id === currentUserId;

            return (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green-700 text-xs font-bold text-cream-100">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{memberEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Owner
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Remove ${name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No members yet. Invite your team below.
            </p>
          )}
        </div>
      </section>

      {/* Pending invites */}
      {invites.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending invites
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">{inv.email}</span>
                <span className="ml-auto text-xs text-muted-foreground">Pending</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      {seatsUsed < maxSeats && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Invite a member
          </h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={isPending || !email}
              className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Sending…" : "Send invite"}
            </button>
          </form>

          {inviteError && (
            <p className="mt-2 text-sm text-destructive">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-2 text-sm text-brand-green-600">Invite sent!</p>
          )}
        </section>
      )}

      {seatsUsed >= maxSeats && (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Your team is full ({maxSeats} seats used).{" "}
          <a href="/billing/upgrade" className="text-accent underline">
            Upgrade your plan
          </a>{" "}
          to add more seats.
        </p>
      )}

      <div className="border-t border-border pt-4">
        <a href="/billing" className="text-sm text-accent underline">
          Manage billing →
        </a>
      </div>
    </div>
  );
}
