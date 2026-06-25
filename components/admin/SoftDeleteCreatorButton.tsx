"use client";

import { useTransition } from "react";
import { Loader2, EyeOff } from "lucide-react";
import { softDeleteCreator } from "@/lib/actions/admin";

interface Props {
  id: string;
  name: string;
}

export function SoftDeleteCreatorButton({ id, name }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Deactivate "${name}"? They will no longer appear publicly.`)) return;
    startTransition(async () => {
      await softDeleteCreator(id);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
      title="Deactivate"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
      Deactivate
    </button>
  );
}
