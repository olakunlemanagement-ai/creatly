"use client";

import { useTransition } from "react";
import { Loader2, UserMinus } from "lucide-react";
import { removeAdmin } from "@/lib/actions/admin";

interface Props {
  userId: string;
  email: string;
}

export function RemoveAdminButton({ userId, email }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Remove admin access for "${email}"? They will be downgraded to a regular user.`)) return;
    startTransition(async () => {
      await removeAdmin(userId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
      title="Remove admin access"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
      Remove
    </button>
  );
}
