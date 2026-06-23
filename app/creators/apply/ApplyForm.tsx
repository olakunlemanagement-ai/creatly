"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applyAsCreatorSchema, type ApplyAsCreatorInput } from "@/lib/validations/creator";
import { applyAsCreator } from "@/lib/actions/creator";

const labelClass = "block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const errorClass = "mt-1 text-xs text-destructive";

export function ApplyForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ApplyAsCreatorInput>({
    resolver: zodResolver(applyAsCreatorSchema),
    defaultValues: {
      handle: "",
      display_name: "",
      bio: "",
      location: "",
      website: "",
      agree_to_terms: undefined,
    },
  });

  function onSubmit(data: ApplyAsCreatorInput) {
    startTransition(async () => {
      const result = await applyAsCreator(data);
      if (result?.error) {
        if (result.field) {
          form.setError(result.field as keyof ApplyAsCreatorInput, {
            message: result.error,
          });
        } else {
          form.setError("root", { message: result.error });
        }
      }
      // On success the server action redirects to /creator
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Handle */}
      <div>
        <label htmlFor="handle" className={labelClass}>
          Handle <span className="text-terracotta-500">*</span>
        </label>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            @
          </span>
          <input
            id="handle"
            type="text"
            autoComplete="off"
            placeholder="ada_okafor"
            {...form.register("handle")}
            className={`${inputClass} pl-7`}
          />
        </div>
        {form.formState.errors.handle && (
          <p className={errorClass}>{form.formState.errors.handle.message}</p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          3–30 characters: lowercase letters, numbers, underscores only.
        </p>
      </div>

      {/* Display name */}
      <div>
        <label htmlFor="display_name" className={labelClass}>
          Display name <span className="text-terracotta-500">*</span>
        </label>
        <input
          id="display_name"
          type="text"
          placeholder="Ada Okafor"
          {...form.register("display_name")}
          className={inputClass}
        />
        {form.formState.errors.display_name && (
          <p className={errorClass}>{form.formState.errors.display_name.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <textarea
          id="bio"
          rows={3}
          placeholder="A short description of your work and style."
          {...form.register("bio")}
          className={`${inputClass} resize-none`}
        />
        {form.formState.errors.bio && (
          <p className={errorClass}>{form.formState.errors.bio.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className={labelClass}>
          Location <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <input
          id="location"
          type="text"
          placeholder="Lagos, Nigeria"
          {...form.register("location")}
          className={inputClass}
        />
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className={labelClass}>
          Website <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <input
          id="website"
          type="url"
          placeholder="https://yoursite.com"
          {...form.register("website")}
          className={inputClass}
        />
        {form.formState.errors.website && (
          <p className={errorClass}>{form.formState.errors.website.message}</p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <input
          id="agree_to_terms"
          type="checkbox"
          {...form.register("agree_to_terms")}
          className="mt-0.5 h-4 w-4 rounded border-input accent-terracotta-500"
        />
        <label htmlFor="agree_to_terms" className="text-sm leading-relaxed text-foreground">
          I agree to the{" "}
          <a href="#" className="text-terracotta-500 underline underline-offset-2 hover:text-terracotta-600">
            creator terms
          </a>{" "}
          and understand that my assets are subject to content guidelines.
        </label>
      </div>
      {form.formState.errors.agree_to_terms && (
        <p className={errorClass}>{form.formState.errors.agree_to_terms.message}</p>
      )}

      {/* Server error */}
      {form.formState.errors.root && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
      >
        {isPending ? "Creating your profile…" : "Create creator profile →"}
      </button>
    </form>
  );
}
