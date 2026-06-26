"use client";

import { useTransition, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { inviteAdmin } from "@/lib/actions/admin";

export function InviteAdminForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (new FormData(e.currentTarget).get("email") as string | null)?.trim() ?? "";
    if (!email) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await inviteAdmin(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-1 text-sm font-semibold text-foreground">Invite admin</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        An email will be sent with a link to accept the invite. The link expires in 7 days.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="email@example.com"
          disabled={isPending}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send invite
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-xs text-green-600">Invite sent successfully.</p>
      )}
    </div>
  );
}
