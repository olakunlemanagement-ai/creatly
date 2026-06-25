"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateCategory } from "@/lib/actions/admin";

interface Props {
  id: string;
  isActive: boolean;
  hasResources?: boolean;
}

export function ToggleCategoryButton({ id, isActive, hasResources }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (isActive && hasResources) {
      if (!window.confirm("This category has resources. Deactivating will hide it from public browse. Continue?")) {
        return;
      }
    }
    startTransition(async () => {
      await updateCategory({ id, is_active: !isActive });
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        isActive
          ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600"
          : "bg-muted text-muted-foreground hover:bg-green-50 hover:text-green-700"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : null}
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}
