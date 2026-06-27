"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/lib/validations/admin";
import { createCategory, updateCategory } from "@/lib/actions/admin";
import type { Category } from "@/types/database";

const labelClass = "block text-xs font-semibold text-muted-foreground";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Props {
  category?: Category;
  nextSortOrder?: number;
}

export function CategoryForm({ category, nextSortOrder = 0 }: Props) {
  const isEdit = !!category;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order ?? nextSortOrder,
    } as CreateCategoryInput,
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue("name", e.target.value);
    if (!isEdit) {
      form.setValue("slug", toSlug(e.target.value));
    }
  }

  function onSubmit(data: CreateCategoryInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCategory({ ...data, id: category!.id })
        : await createCategory(data);

      if (result.error) {
        form.setError("root", { message: result.error });
        return;
      }

      router.push("/backstage-cl-hq-manage-9x3kp2/categories");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      {form.formState.errors.root && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      {/* Name */}
      <div>
        <label htmlFor="cat-name" className={labelClass}>
          Name <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="cat-name"
          type="text"
          {...form.register("name")}
          onChange={handleNameChange}
          className={inputClass}
          placeholder="e.g. Social Media"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="cat-slug" className={labelClass}>
          Slug <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="cat-slug"
          type="text"
          {...form.register("slug")}
          className={inputClass}
          placeholder="social-media"
        />
        {form.formState.errors.slug && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="cat-description" className={labelClass}>Description</label>
        <textarea
          id="cat-description"
          rows={2}
          {...form.register("description")}
          className={`${inputClass} resize-none`}
          placeholder="Short description for this category..."
        />
      </div>

      {/* Sort order */}
      <div>
        <label htmlFor="cat-sort" className={labelClass}>Sort order</label>
        <input
          id="cat-sort"
          type="number"
          min={0}
          {...form.register("sort_order", { valueAsNumber: true })}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Lower numbers appear first. Adjustable from the category list.
        </p>
      </div>

      {/* is_active */}
      <div className="flex items-center gap-3">
        <input
          id="cat-active"
          type="checkbox"
          {...form.register("is_active")}
          className="h-4 w-4 rounded border-border text-brand-green-700 focus:ring-ring"
        />
        <label htmlFor="cat-active" className="text-sm font-medium text-foreground">
          Active — visible in browse and category filters
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-800 disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create category"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/backstage-cl-hq-manage-9x3kp2/categories")}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
