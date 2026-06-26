"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { adminUpdateResource } from "@/lib/actions/admin-upload";
import { COMPATIBLE_SOFTWARE_OPTIONS } from "@/lib/validations/admin";
import type { Resource } from "@/types/database";

interface Category { id: string; name: string }
interface Creator { id: string; name: string }

interface Props {
  resource: Resource;
  categories: Category[];
  creators: Creator[];
}

export function ResourceEditForm({ resource, categories, creators }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initialSoftware = resource.compatible_software ?? [];

  const [form, setForm] = useState({
    title: resource.title,
    description: resource.description ?? "",
    slug: resource.slug,
    category_id: resource.category_id,
    creator_id: resource.creator_id,
    tags: (resource.tags ?? []).join(", "),
    compatible_software: initialSoftware,
    is_featured: resource.is_featured,
    status: (resource.status === "published" ? "published" : "draft") as "draft" | "published",
  });

  function toggleSoftware(item: string) {
    setForm((f) => ({
      ...f,
      compatible_software: f.compatible_software.includes(item)
        ? f.compatible_software.filter((x) => x !== item)
        : [...f.compatible_software, item],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("slug", form.slug.trim());
    fd.append("category_id", form.category_id);
    fd.append("creator_id", form.creator_id);
    fd.append("tags", form.tags.trim());
    fd.append("compatible_software", form.compatible_software.join(", "));
    fd.append("is_featured", String(form.is_featured));
    fd.append("status", form.status);

    startTransition(async () => {
      const result = await adminUpdateResource(resource.id, fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          maxLength={120}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Slug</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
        />
      </div>

      {/* Category + Creator */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Creator <span className="text-destructive">*</span>
          </label>
          <select
            value={form.creator_id}
            onChange={(e) => setForm((f) => ({ ...f, creator_id: e.target.value }))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
          >
            {creators.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Tags</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="mockup, branding, packaging"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
        />
      </div>

      {/* Compatible software */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Compatible software</label>
        <div className="flex flex-wrap gap-2">
          {COMPATIBLE_SOFTWARE_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleSoftware(item)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                form.compatible_software.includes(item)
                  ? "border-brand-green-600 bg-brand-green-50 text-brand-green-700 dark:bg-brand-green-950 dark:text-brand-green-400"
                  : "border-border bg-background text-muted-foreground hover:border-brand-green-400",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Status + Featured */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="pt-5">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
            className={[
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              form.is_featured
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                : "border-border bg-background text-muted-foreground hover:border-amber-400",
            ].join(" ")}
          >
            <Star className={`h-4 w-4 ${form.is_featured ? "fill-amber-400 text-amber-400" : ""}`} />
            {form.is_featured ? "Featured" : "Mark as featured"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Resource updated successfully.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800 disabled:opacity-40 disabled:pointer-events-none"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
