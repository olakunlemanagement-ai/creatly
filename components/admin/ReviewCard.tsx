"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { approveResource, rejectResource } from "@/lib/actions/admin";
import { getPreviewImageUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ReviewItem = {
  id: string;
  title: string;
  description: string | null;
  preview_image_path: string;
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  tags: string[];
  submitted_at: string | null;
  creator_name: string;
  creator_handle: string;
  category_name: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveResource(item.id);
      if (result.error) setError(result.error);
    });
  }

  function handleReject() {
    if (!showReject) {
      setShowReject(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectResource(item.id, reason);
      if (result.error) setError(result.error);
      else setShowReject(false);
    });
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          <Image
            src={getPreviewImageUrl(item.preview_image_path)}
            alt={item.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight truncate">{item.title}</h3>
            {item.submitted_at && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(item.submitted_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span>
              by <span className="font-medium text-foreground">{item.creator_name}</span>{" "}
              <span className="opacity-60">@{item.creator_handle}</span>
            </span>
            <span>·</span>
            <span>{item.category_name}</span>
          </div>

          {item.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary">{item.file_type.toUpperCase()}</Badge>
            <Badge variant="secondary">{formatBytes(item.file_size_bytes)}</Badge>
            <Badge variant="secondary">{item.file_name}</Badge>
          </div>

          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                  {tag}
                </span>
              ))}
              {item.tags.length > 6 && (
                <span className="text-xs text-muted-foreground">+{item.tags.length - 6} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject reason input */}
      {showReject && (
        <div className="px-4 pb-3 border-t pt-3">
          <label className="text-sm font-medium mb-1.5 block">
            Rejection reason <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            placeholder="Explain what needs to be fixed so the creator can resubmit…"
            rows={3}
            maxLength={500}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">{reason.length}/500</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="px-4 pb-2 text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isPending || showReject}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant={showReject ? "destructive" : "outline"}
          onClick={handleReject}
          disabled={isPending || (showReject && reason.trim().length < 10)}
        >
          {showReject ? "Confirm reject" : "Reject"}
        </Button>
        {showReject && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setShowReject(false); setReason(""); setError(null); }}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
