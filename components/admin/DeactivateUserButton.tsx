"use client";

import { useState, useTransition } from "react";
import { deactivateUser } from "@/lib/actions/admin";

interface Props {
  userId: string;
  userName: string;
}

export function DeactivateUserButton({ userId, userName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deactivateUser(userId);
      if (result.error) setError(result.error);
      else setConfirmed(false);
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          confirmed
            ? "bg-red-600 text-white hover:bg-red-700"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } disabled:opacity-50`}
      >
        {isPending ? "Deactivating…" : confirmed ? "Confirm deactivate" : "Deactivate"}
      </button>
      {confirmed && !isPending && (
        <button
          onClick={() => setConfirmed(false)}
          className="text-[10px] text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      )}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
