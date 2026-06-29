"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Folder, Tag, Loader2 } from "lucide-react";
import { getPreviewImageUrl } from "@/lib/storage";

type ResourceSuggestion = {
  type: "resource";
  title: string;
  slug: string;
  category: string;
  preview_url: string | null;
};
type CategorySuggestion = { type: "category"; name: string; slug: string };
type TagSuggestion = { type: "tag"; tag: string };
type Suggestion = ResourceSuggestion | CategorySuggestion | TagSuggestion;

interface ApiResponse {
  ok: boolean;
  data: { suggestions: Suggestion[] };
}

interface SearchSuggestionsProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  inputClassName?: string;
  placeholder?: string;
}

export function SearchSuggestions({
  query,
  onQueryChange,
  onSubmit,
  inputClassName,
  placeholder = "Search templates, fonts, mockups…",
}: SearchSuggestionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasQueried, setHasQueried] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, [pathname]);

  // Fetch suggestions with 200ms debounce
  useEffect(() => {
    if (!open || query.length < 2) {
      setSuggestions([]);
      setHasQueried(false);
      setActiveIndex(-1);
      setLoading(false);
      clearTimeout(debounceRef.current);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const json: ApiResponse = await res.json();
          setSuggestions(json.data.suggestions);
        }
      } catch {
        // silently fail — suggestions are a UX enhancement, not critical
      } finally {
        setLoading(false);
        setHasQueried(true);
        setActiveIndex(-1);
      }
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  function getSuggestionUrl(s: Suggestion): string {
    switch (s.type) {
      case "resource":
        return `/resources/${s.slug}`;
      case "category":
        return `/browse?category=${s.slug}`;
      case "tag":
        return `/browse?q=${encodeURIComponent(s.tag)}`;
    }
  }

  function handleSelect(s: Suggestion) {
    setOpen(false);
    setActiveIndex(-1);
    if (s.type === "tag") {
      onQueryChange(s.tag);
    } else {
      onQueryChange("");
    }
    router.push(getSuggestionUrl(s));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) =>
          suggestions.length === 0 ? -1 : (i + 1) % suggestions.length,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) =>
          suggestions.length === 0
            ? -1
            : (i - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Enter":
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          e.preventDefault();
          handleSelect(suggestions[activeIndex]);
        } else {
          onSubmit();
        }
        break;
    }
  }

  const showDropdown =
    open && query.length >= 2 && (loading || hasQueried);

  return (
    <>
      <input
        type="search"
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay to allow click on suggestion items to register first
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />

      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg"
        >
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-stone-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-stone-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul>
              {suggestions.map((s, i) => (
                <li key={`${s.type}-${i}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                    className={[
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                      i === activeIndex ? "bg-stone-50" : "hover:bg-stone-50",
                      i > 0 ? "border-t border-stone-100" : "",
                    ].join(" ")}
                  >
                    {s.type === "resource" && (
                      <>
                        {s.preview_url ? (
                          <Image
                            src={getPreviewImageUrl(s.preview_url)}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded bg-stone-100" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-stone-800">
                            {s.title}
                          </p>
                          <p className="text-xs text-stone-400">{s.category}</p>
                        </div>
                      </>
                    )}

                    {s.type === "category" && (
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-stone-100">
                          <Folder className="h-4 w-4 text-stone-500" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-stone-800">
                            {s.name}
                          </p>
                          <p className="text-xs text-stone-400">Category</p>
                        </div>
                      </>
                    )}

                    {s.type === "tag" && (
                      <>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-stone-100">
                          <Tag className="h-4 w-4 text-stone-500" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-stone-800">
                            {s.tag}
                          </p>
                          <p className="text-xs text-stone-400">Tag</p>
                        </div>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
