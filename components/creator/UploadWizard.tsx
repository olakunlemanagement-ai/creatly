"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronRight, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitAsset, saveDraft } from "@/lib/actions/upload";
import { uploadDetailsSchema, type UploadDetailsInput, MAX_FILE_SIZE_BYTES, MAX_PREVIEW_SIZE_BYTES } from "@/lib/validations/upload";

type FormValues = UploadDetailsInput;

interface UploadCategory {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

interface UploadWizardProps {
  categories: UploadCategory[];
  userId: string;
  existingDraftId?: string;
}

const TOTAL_STEPS = 3;

function StepBar({ current }: { current: number }) {
  const LABELS = ["Files", "Details", "Preview & submit"];
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                step < current
                  ? "bg-brand-green-600 text-white"
                  : step === current
                    ? "bg-terracotta-500 text-white"
                    : "border border-border bg-background text-muted-foreground",
              ].join(" ")}
            >
              {step < current ? <Check className="h-3 w-3" /> : step}
            </div>
            <span className={`hidden text-xs sm:inline ${step === current ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {LABELS[step - 1]}
            </span>
          </div>
          {step < TOTAL_STEPS && (
            <div className={`h-px w-6 ${step < current ? "bg-brand-green-600" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface FileState {
  path: string;
  name: string;
  size: number;
  type: string;
}

// Cascading two-level category selector: main → sub-category
function CascadingCategorySelect({
  categories,
  value,
  onChange,
  error,
}: {
  categories: UploadCategory[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  // Determine if the current value is a main or sub-category
  const selectedMain = categories.find(
    (c) => c.id === value || c.children.some((ch) => ch.id === value),
  );
  const selectedMainId = selectedMain?.id ?? "";
  const subCategories = selectedMain?.children ?? [];

  function handleMainChange(mainId: string) {
    const main = categories.find((c) => c.id === mainId);
    if (!main) { onChange(""); return; }
    // If no children, the main category itself is the selection
    if (main.children.length === 0) {
      onChange(main.id);
    } else {
      // Require sub-category selection — clear for now
      onChange("");
    }
  }

  function handleSubChange(subId: string) {
    onChange(subId);
  }

  return (
    <div className="space-y-2">
      <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Category <span className="text-terracotta-500">*</span>
      </label>

      {/* Main category */}
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

      {/* Sub-category — shown only when the selected main has children */}
      {subCategories.length > 0 && (
        <select
          value={subCategories.some((c) => c.id === value) ? value : ""}
          onChange={(e) => handleSubChange(e.target.value)}
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

export function UploadWizard({ categories, userId, existingDraftId }: UploadWizardProps) {
  const [step, setStep] = useState(1);
  const [sourceFile, setSourceFile] = useState<FileState | null>(null);
  const [previewFile, setPreviewFile] = useState<FileState | null>(null);
  const [uploadingSource, setUploadingSource] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(existingDraftId);
  const [isSavingDraft, startSavingDraft] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(uploadDetailsSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      tags: "",
      compatible_software: "",
      file_path: "",
      file_name: "",
      file_size_bytes: 0,
      file_type: "",
      preview_image_path: "",
    },
  });

  async function handleSourceFile(file: File) {
    setFileError(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File exceeds the 200 MB limit.");
      return;
    }
    setUploadingSource(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("resource-files")
        .upload(path, file, { upsert: false });

      if (error) throw error;

      setSourceFile({ path, name: file.name, size: file.size, type: file.type });
      form.setValue("file_path", path, { shouldValidate: true });
      form.setValue("file_name", file.name, { shouldValidate: true });
      form.setValue("file_size_bytes", file.size, { shouldValidate: true });
      form.setValue("file_type", file.type || "application/octet-stream", { shouldValidate: true });
    } catch (err) {
      console.error("Source file upload error", err);
      setFileError("Upload failed. Please try again.");
    } finally {
      setUploadingSource(false);
    }
  }

  async function handlePreviewFile(file: File) {
    setPreviewError(null);
    if (file.size > MAX_PREVIEW_SIZE_BYTES) {
      setPreviewError("Preview image must be under 5 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPreviewError("Preview must be an image (PNG, JPG, WebP).");
      return;
    }
    setUploadingPreview(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/${Date.now()}-preview.${ext}`;
      const { error } = await supabase.storage
        .from("resource-previews")
        .upload(path, file, { upsert: false });

      if (error) throw error;

      setPreviewFile({ path, name: file.name, size: file.size, type: file.type });
      form.setValue("preview_image_path", path, { shouldValidate: true });
    } catch (err) {
      console.error("Preview upload error", err);
      setPreviewError("Preview upload failed. Please try again.");
    } finally {
      setUploadingPreview(false);
    }
  }

  function handleSaveDraft() {
    const values = form.getValues();
    startSavingDraft(async () => {
      const result = await saveDraft({ ...values, existing_id: draftId });
      if (result.error) setServerError(result.error);
      else if (result.resourceId) setDraftId(result.resourceId);
    });
  }

  function handleSubmit() {
    setServerError(null);
    form.handleSubmit((data) => {
      startSubmitting(async () => {
        const result = await submitAsset(data);
        if (result?.error) setServerError(result.error);
      });
    })();
  }

  const watchedValues = form.watch();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <StepBar current={step} />
        <span className="font-mono text-xs text-muted-foreground">
          {String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
        </span>
      </div>

      {/* Step 1: Files */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {"// Step 1"}
            </p>
            <h2 className="mt-1 font-heading text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Upload your files
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Resource file <span className="text-terracotta-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => sourceInputRef.current?.click()}
              className={[
                "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                sourceFile
                  ? "border-brand-green-600 bg-brand-green-50"
                  : "border-border hover:border-terracotta-300",
              ].join(" ")}
            >
              {uploadingSource ? (
                <p className="text-sm text-muted-foreground">Uploading…</p>
              ) : sourceFile ? (
                <>
                  <Check className="h-6 w-6 text-brand-green-600" />
                  <p className="text-sm font-medium text-foreground">{sourceFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(sourceFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSourceFile(null); form.setValue("file_path", ""); }}
                    className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground">ZIP, PDF, fonts, SVG — up to 200 MB</p>
                </>
              )}
            </button>
            <input
              ref={sourceInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSourceFile(f); }}
            />
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Preview image <span className="text-terracotta-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => previewInputRef.current?.click()}
              className={[
                "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                previewFile
                  ? "border-brand-green-600 bg-brand-green-50"
                  : "border-border hover:border-terracotta-300",
              ].join(" ")}
            >
              {uploadingPreview ? (
                <p className="text-sm text-muted-foreground">Uploading…</p>
              ) : previewFile ? (
                <>
                  <Check className="h-5 w-5 text-brand-green-600" />
                  <p className="text-sm font-medium text-foreground">{previewFile.name}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewFile(null); form.setValue("preview_image_path", ""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Upload preview image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WebP — up to 5 MB</p>
                </>
              )}
            </button>
            <input
              ref={previewInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePreviewFile(f); }}
            />
            {previewError && <p className="text-xs text-destructive">{previewError}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isSavingDraft || !sourceFile}
              onClick={handleSaveDraft}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/30 disabled:opacity-40"
            >
              {isSavingDraft ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={!sourceFile || !previewFile}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-xl bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-50"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {"// Step 2"}
            </p>
            <h2 className="mt-1 font-heading text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Add details
            </h2>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Title <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Modern Brand Identity Kit"
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
              rows={3}
              placeholder="What's included, use cases, compatible software…"
              {...form.register("description")}
              className="mt-1.5 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <CascadingCategorySelect
            categories={categories}
            value={watchedValues.category_id}
            onChange={(id) => form.setValue("category_id", id, { shouldValidate: true })}
            error={form.formState.errors.category_id?.message}
          />

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Tags <span className="text-muted-foreground/60 normal-case font-sans text-[11px]">(comma-separated)</span>
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
              Compatible software <span className="text-muted-foreground/60 normal-case font-sans text-[11px]">(comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="Figma, Canva, Adobe Illustrator"
              {...form.register("compatible_software")}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/30"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isSavingDraft}
              onClick={handleSaveDraft}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/30 disabled:opacity-40"
            >
              {isSavingDraft ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const valid = await form.trigger(["title", "category_id"]);
                if (valid) setStep(3);
              }}
              className="flex items-center gap-2 rounded-xl bg-terracotta-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
            >
              Preview <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & submit */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {"// Step 3"}
            </p>
            <h2 className="mt-1 font-heading text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Preview & submit
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {previewFile && (
              <div className="aspect-[4/3] w-full bg-muted">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resource-previews/${previewFile.path}`}
                  alt="Preview"
                  width={640}
                  height={480}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-4 space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {(() => {
                  const id = watchedValues.category_id;
                  for (const cat of categories) {
                    if (cat.id === id) return cat.name;
                    const sub = cat.children.find((c) => c.id === id);
                    if (sub) return `${cat.name} › ${sub.name}`;
                  }
                  return "Uncategorised";
                })()}
              </p>
              <p className="font-semibold text-foreground">{watchedValues.title || "Untitled"}</p>
              {watchedValues.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{watchedValues.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {sourceFile ? `${(sourceFile.size / 1024 / 1024).toFixed(1)} MB · ${sourceFile.type}` : ""}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Summary</p>
            {watchedValues.tags && String(watchedValues.tags).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {String(watchedValues.tags).split(",").filter(Boolean).map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.trim()}</span>
                ))}
              </div>
            )}
            {watchedValues.compatible_software && String(watchedValues.compatible_software).length > 0 && (
              <p className="text-xs text-muted-foreground">
                Works with: {String(watchedValues.compatible_software).split(",").filter(Boolean).map((s) => s.trim()).join(", ")}
              </p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/30 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-terracotta-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60"
            >
              {isSubmitting ? "Publishing…" : "Publish asset →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
