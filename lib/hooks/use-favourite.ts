"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse } from "@/types/api";

interface UseFavouriteOptions {
  resourceId: string;
  resourceSlug: string;
  initialFavourited: boolean;
  userId: string | null;
}

interface UseFavouriteResult {
  isFavourited: boolean;
  toggle: () => Promise<void>;
  isPending: boolean;
}

export function useFavourite({
  resourceId,
  resourceSlug,
  initialFavourited,
  userId,
}: UseFavouriteOptions): UseFavouriteResult {
  const router = useRouter();
  const [isFavourited, setIsFavourited] = useState(initialFavourited);
  const [isPending, setIsPending] = useState(false);

  async function toggle() {
    if (!userId) {
      router.push(`/signup?next=/resources/${resourceSlug}`);
      return;
    }

    if (isPending) return;

    const prev = isFavourited;
    setIsFavourited(!prev); // optimistic
    setIsPending(true);

    try {
      const res = await fetch(`/api/favourites/${resourceId}`, {
        method: "POST",
      });
      const json = (await res.json()) as ApiResponse<{ favourited: boolean }>;
      if (!json.ok) {
        setIsFavourited(prev); // rollback
      } else {
        setIsFavourited(json.data.favourited);
      }
    } catch {
      setIsFavourited(prev); // rollback on network error
    } finally {
      setIsPending(false);
    }
  }

  return { isFavourited, toggle, isPending };
}
