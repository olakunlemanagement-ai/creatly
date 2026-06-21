"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, SORT_LABELS, type SortOption } from "@/lib/validations/browse";

interface SortControlProps {
  activeSort: SortOption;
}

export function SortControl({ activeSort }: SortControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as SortOption;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`/browse?${params.toString()}`);
    });
  }

  return (
    <select
      value={activeSort}
      onChange={handleChange}
      aria-label="Sort resources"
      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {SORT_LABELS[opt]}
        </option>
      ))}
    </select>
  );
}
