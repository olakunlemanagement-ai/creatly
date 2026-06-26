"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editAssetSchema, type EditAssetInput } from "@/lib/validations/upload";
import { updateAsset } from "@/lib/actions/asset-edit";

interface EditCategory {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

interface AssetEditFormProps {
  assetId: string;
  defaultValues: EditAssetInput;
  categories: EditCategory[];
  showReReviewWarning: boolean;
}

function CascadingCategorySelect({
  categories,
  value,
  onChange,
  error,
}: {
  categories: EditCategory[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const selectedMain = categories.find(
    (c) => c.id === value || c.children.some((ch) => ch.id === value),
  );
  const selectedMainId = selectedMain?.id ?? "";
  const subCategories = selectedMain?.children ?? [];

  function handleMainChange(mainId: string) {
    const main = categories.find((c) => c.id === mainId);
    if (!main) { onChange(""); return; }
    if (main.children.length === 0) {
      onChange(main.id);
    } else {
      onChange("");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Category <span className="text-terracotta-500">*</span>
      </label>
      <select
        value={selectedMainId}
        onChange={(e) => handleMainChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Select a category…</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {subCategories.length > 0 && (
        <select
          value={subCategories.some((c) => c.id === value) ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Sub-category"
        >
          <option value="">Select a sub-category…</option>
          {subCategories.map((sub) => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AssetEditForm({
  assetId,
  defaultValues,
  categories,
  showReReviewWarning,
}: AssetEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditAssetInput>({
    resolver: zodResolver(editAssetSchema),
    defaultValues,
  });

  function handleSubmit() {
    setServerError(null);
    form.handleSubmit((data) => {
      startTransition(async () => {
        const result = await updateAsset(assetId, data);
        if (result?.error) setServerError(result.error);
      });
    })();
  }

  return (
    <div className="space-y-5">
      {showReReviewWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <strong>Heads up:</strong> Saving changes to a published asset will send it back for admin review. It will be temporarily unavailable until re-approved.
        </div>
      )}

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Title <span className="text-terracotta-500">*</span>
        </label>
        <input
          type="text"
          {...form.register("title")}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Description
        </label>
        <textarea
          rows={4}
          {...form.register("description")}
          className="mt-1.5 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <CascadingCategorySelect
        categories={categories}
        value={form.watch("category_id")}
        onChange={(id) => form.setValue("category_id", id, { shouldValidate: true })}
        error={form.formState.errors.category_id?.message}
      />

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Tags{" "}
          <span className="normal-case font-sans text-[11px] text-muted-foreground/60">
            (comma-separated)
          </span>
        </label>
        <input
          type="text"
          placeholder="branding, logo, identity"
          {...form.register("tags")}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Compatible software{" "}
          <span className="normal-case font-sans text-[11px] text-muted-foreground/60">
            (comma-separated)
          </span>
        </label>
        <input
          type="text"
          placeholder="Figma, Canva, Adobe Illustrator"
          {...form.register("compatible_software")}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <a
          href="/creator/assets"
          className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/30"
        >
          Cancel
        </a>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-xl bg-terracotta-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
