"use client";

import { useTransition } from "react";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { moveCategoryOrder } from "@/lib/actions/admin";

interface Props {
  id: string;
  isFirst: boolean;
  isLast: boolean;
}

export function CategoryOrderButtons({ id, isFirst, isLast }: Props) {
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveCategoryOrder(id, direction);
    });
  }

  return (
    <div className="flex items-center gap-0.5">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <button
            onClick={() => move("up")}
            disabled={isFirst || isPending}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => move("down")}
            disabled={isLast || isPending}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
