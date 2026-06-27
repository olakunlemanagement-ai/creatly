"use client";

import { useTransition, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import {
  createCreatorSchema,
  type CreateCreatorInput,
} from "@/lib/validations/admin";
import { createCreator, updateCreator } from "@/lib/actions/admin";
import type { Creator } from "@/types/database";

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
  creator?: Creator;
}

export function CreatorForm({ creator }: Props) {
  const isEdit = !!creator;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<CreateCreatorInput>({
    resolver: zodResolver(createCreatorSchema),
    defaultValues: {
      name: creator?.name ?? "",
      slug: creator?.slug ?? "",
      bio: creator?.bio ?? "",
      website_url: creator?.website_url ?? "",
      is_public: creator?.is_public ?? true,
    } as CreateCreatorInput,
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue("name", e.target.value);
    if (!isEdit) {
      form.setValue("slug", toSlug(e.target.value));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  function onSubmit(data: CreateCreatorInput) {
    startTransition(async () => {
      const avatarFormData = fileRef.current?.files?.[0]
        ? (() => {
            const fd = new FormData();
            fd.append("avatar", fileRef.current!.files![0]);
            return fd;
          })()
        : undefined;

      const result = isEdit
        ? await updateCreator({ ...data, id: creator!.id }, avatarFormData)
        : await createCreator(data, avatarFormData);

      if (result.error) {
        form.setError("root", { message: result.error });
        return;
      }

      router.push("/backstage-cl-hq-manage-9x3kp2/creators");
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      {form.formState.errors.root && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      {/* Avatar upload */}
      <div>
        <span className={labelClass}>Avatar (optional)</span>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : creator?.avatar_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_path} alt={creator.name} className="h-full w-full object-cover" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Choose image
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClass}>
          Name <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...form.register("name")}
          onChange={handleNameChange}
          className={inputClass}
          placeholder="e.g. Creatly Studio"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug <span className="text-terracotta-500">*</span>
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            /creators/
          </span>
          <input
            id="slug"
            type="text"
            {...form.register("slug")}
            className={`${inputClass} mt-0 pl-[6.25rem]`}
            placeholder="creatly-studio"
          />
        </div>
        {form.formState.errors.slug && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <textarea
          id="bio"
          rows={3}
          {...form.register("bio")}
          className={`${inputClass} resize-none`}
          placeholder="Short creator bio..."
        />
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website_url" className={labelClass}>Website URL</label>
        <input
          id="website_url"
          type="url"
          {...form.register("website_url")}
          className={inputClass}
          placeholder="https://example.com"
        />
        {form.formState.errors.website_url && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.website_url.message}</p>
        )}
      </div>

      {/* is_public */}
      <div className="flex items-center gap-3">
        <input
          id="is_public"
          type="checkbox"
          {...form.register("is_public")}
          className="h-4 w-4 rounded border-border text-brand-green-700 focus:ring-ring"
        />
        <label htmlFor="is_public" className="text-sm font-medium text-foreground">
          Public — visible in catalogue and creator pages
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-800 disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create creator"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/backstage-cl-hq-manage-9x3kp2/creators")}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
