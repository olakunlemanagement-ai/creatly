"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCreatorProfileSchema, type UpdateCreatorProfileInput } from "@/lib/validations/creator";
import { updateCreatorProfile } from "@/lib/actions/creator";
import type { CreatorProfile } from "@/types/database";

const labelClass = "block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface ProfileEditorProps {
  profile: CreatorProfile;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const form = useForm<UpdateCreatorProfileInput>({
    resolver: zodResolver(updateCreatorProfileSchema),
    defaultValues: {
      display_name: profile.display_name,
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      website: profile.website ?? "",
    },
  });

  function onSubmit(data: UpdateCreatorProfileInput) {
    setSaved(false);
    startTransition(async () => {
      const result = await updateCreatorProfile(data);
      if (result.error) {
        form.setError("root", { message: result.error });
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Handle</label>
        <div className="mt-1.5 flex items-center gap-1 rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span>@{profile.handle}</span>
          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px]">cannot change</span>
        </div>
      </div>

      <div>
        <label htmlFor="display_name" className={labelClass}>
          Display name <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="display_name"
          type="text"
          {...form.register("display_name")}
          className={inputClass}
        />
        {form.formState.errors.display_name && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.display_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <textarea
          id="bio"
          rows={4}
          {...form.register("bio")}
          className={`${inputClass} resize-none`}
        />
        {form.formState.errors.bio && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>Location</label>
        <input
          id="location"
          type="text"
          placeholder="Lagos, Nigeria"
          {...form.register("location")}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="website" className={labelClass}>Website</label>
        <input
          id="website"
          type="url"
          placeholder="https://yoursite.com"
          {...form.register("website")}
          className={inputClass}
        />
        {form.formState.errors.website && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.website.message}</p>
        )}
      </div>

      {form.formState.errors.root && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      {saved && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Profile saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
