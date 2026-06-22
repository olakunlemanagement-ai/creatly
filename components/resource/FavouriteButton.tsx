"use client";

import { Heart } from "lucide-react";
import { useFavourite } from "@/lib/hooks/use-favourite";

interface FavouriteButtonProps {
  resourceId: string;
  resourceSlug: string;
  isFavourited: boolean;
  userId: string | null;
  /** card — small overlay heart on the image; sidebar — labelled "Save" button */
  variant?: "card" | "sidebar";
}

export function FavouriteButton({
  resourceId,
  resourceSlug,
  isFavourited: initialFavourited,
  userId,
  variant = "card",
}: FavouriteButtonProps) {
  const { isFavourited, toggle, isPending } = useFavourite({
    resourceId,
    resourceSlug,
    initialFavourited,
    userId,
  });

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault(); // don't follow the parent card Link
          void toggle();
        }}
        disabled={isPending}
        aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
        className="rounded-full bg-background/80 p-1.5 backdrop-blur transition-colors hover:text-foreground disabled:cursor-not-allowed"
      >
        <Heart
          className={`size-3.5 transition-colors ${
            isFavourited
              ? "fill-terracotta-500 text-terracotta-500"
              : "text-muted-foreground"
          }`}
          strokeWidth={1.5}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={isPending}
      aria-label={isFavourited ? "Remove from favourites" : "Save to favourites"}
      className="flex items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
    >
      <Heart
        className={`size-4 transition-colors ${
          isFavourited
            ? "fill-terracotta-500 text-terracotta-500"
            : ""
        }`}
        strokeWidth={1.5}
      />
      {isFavourited ? "Saved" : "Save to favourites"}
    </button>
  );
}
