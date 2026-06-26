"use client";

import { useState, useTransition } from "react";
import { deleteAsset } from "@/lib/actions/asset-edit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteAssetButtonProps {
  assetId: string;
  assetTitle: string;
}

export function DeleteAssetButton({ assetId, assetTitle }: DeleteAssetButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAsset(assetId);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex-1 rounded-lg border border-destructive/30 py-1.5 text-center text-xs font-medium text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/5"
        >
          Delete
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete draft</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete &ldquo;{assetTitle}&rdquo;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete draft"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
