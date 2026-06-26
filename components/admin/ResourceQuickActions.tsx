"use client";

import { useTransition } from "react";
import { Star, Eye, EyeOff, Archive, Loader2 } from "lucide-react";
import { adminToggleFeatured, adminToggleStatus, adminArchiveResource } from "@/lib/actions/admin-upload";

interface Props {
  id: string;
  isFeatured: boolean;
  status: string;
}

export function ResourceQuickActions({ id, isFeatured, status }: Props) {
  const [isPending, startTransition] = useTransition();

  function toggleFeatured() {
    startTransition(async () => {
      await adminToggleFeatured(id, !isFeatured);
    });
  }

  function toggleStatus() {
    const next = status === "published" ? "draft" : "published";
    startTransition(async () => {
      await adminToggleStatus(id, next);
    });
  }

  function archive() {
    if (!window.confirm("Archive this resource? It will be hidden from the catalogue.")) return;
    startTransition(async () => {
      await adminArchiveResource(id);
    });
  }

  return (
    <div className="flex items-center gap-1">
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <button
            onClick={toggleFeatured}
            title={isFeatured ? "Remove from featured" : "Mark as featured"}
            className={`rounded-lg p-1.5 transition-colors hover:bg-muted ${isFeatured ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
          >
            <Star className={`h-4 w-4 ${isFeatured ? "fill-amber-400" : ""}`} />
          </button>
          {status !== "archived" && (
            <button
              onClick={toggleStatus}
              title={status === "published" ? "Unpublish (set to draft)" : "Publish"}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {status !== "archived" && (
            <button
              onClick={archive}
              title="Archive resource"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
