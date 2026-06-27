"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, ChevronRight, ChevronLeft, Loader2, Star, Check } from "lucide-react";
import { adminCreateResource } from "@/lib/actions/admin-upload";
import { COMPATIBLE_SOFTWARE_OPTIONS } from "@/lib/validations/admin";
import { MAX_FILE_SIZE_BYTES, MAX_PREVIEW_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/validations/upload";

interface Category { id: string; name: string; slug: string }
interface Creator { id: string; name: string }

interface Props {
  categories: Category[];
  creators: Creator[];
}

type Status = "draft" | "published";

interface Step1State {
  sourceFile: File | null;
  previewFile: File | null;
  sourceError: string | null;
  previewError: string | null;
}

interface Step2State {
  title: string;
  description: string;
  slug: string;
  category_id: string;
  creator_id: string;
  tags: string;
  compatible_software: string[];
  is_featured: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STEPS = ["Files", "Details", "Review & Publish"] as const;

export function AdminUploadWizard({ categories, creators }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const [step1, setStep1] = useState<Step1State>({
    sourceFile: null,
    previewFile: null,
    sourceError: null,
    previewError: null,
  });

  const [step2, setStep2] = useState<Step2State>({
    title: "",
    description: "",
    slug: "",
    category_id: categories[0]?.id ?? "",
    creator_id: creators[0]?.id ?? "",
    tags: "",
    compatible_software: [],
    is_featured: false,
  });

  const [publishStatus, setPublishStatus] = useState<Status>("draft");

  // ─── Step 1 validation ───────────────────────────────────────────────────

  function validateSourceFile(file: File): string | null {
    const allowed = ALLOWED_MIME_TYPES as readonly string[];
    if (!allowed.includes(file.type) && !file.type.startsWith("font/")) {
      return `File type '${file.type}' is not allowed.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) return "File exceeds the 200 MB limit.";
    return null;
  }

  function validatePreviewFile(file: File): string | null {
    if (!file.type.startsWith("image/")) return "Preview must be an image file.";
    if (file.size > MAX_PREVIEW_SIZE_BYTES) return "Preview exceeds the 5 MB limit.";
    return null;
  }

  function handleSourceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setStep1((s) => ({ ...s, sourceFile: null, sourceError: null })); return; }
    const err = validateSourceFile(file);
    setStep1((s) => ({ ...s, sourceFile: err ? null : file, sourceError: err }));
    // Auto-populate title from filename if title is empty
    if (!err && !step2.title) {
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const auto = name.charAt(0).toUpperCase() + name.slice(1);
      setStep2((s) => ({ ...s, title: auto, slug: slugify(auto) }));
    }
  }

  function handlePreviewChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setStep1((s) => ({ ...s, previewFile: null, previewError: null })); return; }
    const err = validatePreviewFile(file);
    setStep1((s) => ({ ...s, previewFile: err ? null : file, previewError: err }));
  }

  function canAdvanceStep1(): boolean {
    return !!step1.sourceFile && !!step1.previewFile && !step1.sourceError && !step1.previewError;
  }

  // ─── Step 2 validation ───────────────────────────────────────────────────

  function canAdvanceStep2(): boolean {
    return (
      step2.title.trim().length >= 3 &&
      !!step2.category_id &&
      !!step2.creator_id &&
      /^[a-z0-9-]+$/.test(step2.slug)
    );
  }

  function handleTitleChange(value: string) {
    setStep2((s) => ({
      ...s,
      title: value,
      slug: s.slug === slugify(s.title) || !s.slug ? slugify(value) : s.slug,
    }));
  }

  function toggleSoftware(item: string) {
    setStep2((s) => ({
      ...s,
      compatible_software: s.compatible_software.includes(item)
        ? s.compatible_software.filter((x) => x !== item)
        : [...s.compatible_software, item],
    }));
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!step1.sourceFile || !step1.previewFile) return;
    setSubmitError(null);

    const fd = new FormData();
    fd.append("source_file", step1.sourceFile);
    fd.append("preview_file", step1.previewFile);
    fd.append("title", step2.title.trim());
    fd.append("description", step2.description.trim());
    fd.append("slug", step2.slug.trim());
    fd.append("category_id", step2.category_id);
    fd.append("creator_id", step2.creator_id);
    fd.append("tags", step2.tags.trim());
    fd.append("compatible_software", step2.compatible_software.join(", "));
    fd.append("is_featured", String(step2.is_featured));
    fd.append("status", publishStatus);

    startTransition(async () => {
      const result = await adminCreateResource(fd);
      if (result.error) {
        setSubmitError(result.error);
      } else {
        router.push("/backstage-cl-hq-manage-9x3kp2/resources");
        router.refresh();
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const selectedCategory = categories.find((c) => c.id === step2.category_id);
  const selectedCreator = creators.find((c) => c.id === step2.creator_id);
  const previewObjectUrl = step1.previewFile ? URL.createObjectURL(step1.previewFile) : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <nav className="mb-8 flex items-center gap-0">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => idx < step && setStep(idx)}
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                idx < step
                  ? "cursor-pointer bg-brand-green-700 text-white"
                  : idx === step
                    ? "bg-terracotta-500 text-white"
                    : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
            </button>
            <span
              className={[
                "ml-2 text-sm font-medium",
                idx === step ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="mx-4 h-px w-12 bg-border" />
            )}
          </div>
        ))}
      </nav>

      {/* Step 1 — Files */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Source file <span className="text-destructive">*</span>
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              ZIP, PDF, images, or font files · max 200 MB
            </p>
            <div
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 transition-colors hover:border-brand-green-400 cursor-pointer"
              onClick={() => sourceInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              {step1.sourceFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{step1.sourceFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(step1.sourceFile.size)} · {step1.sourceFile.type}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click to select source file</p>
              )}
              <input
                ref={sourceInputRef}
                type="file"
                className="sr-only"
                accept={[...ALLOWED_MIME_TYPES].join(",")}
                onChange={handleSourceChange}
              />
            </div>
            {step1.sourceError && (
              <p className="mt-1.5 text-xs text-destructive">{step1.sourceError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Preview image <span className="text-destructive">*</span>
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              PNG, JPG, or WebP · max 5 MB
            </p>
            <div
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 transition-colors hover:border-brand-green-400 cursor-pointer overflow-hidden"
              onClick={() => previewInputRef.current?.click()}
            >
              {step1.previewFile && previewObjectUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewObjectUrl}
                  alt="Preview"
                  className="max-h-48 rounded-xl object-cover"
                />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select preview image</p>
                </>
              )}
              <input
                ref={previewInputRef}
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handlePreviewChange}
              />
            </div>
            {step1.previewFile && !step1.previewError && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {step1.previewFile.name} · {formatBytes(step1.previewFile.size)}
              </p>
            )}
            {step1.previewError && (
              <p className="mt-1.5 text-xs text-destructive">{step1.previewError}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canAdvanceStep1()}
              className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              Next: Details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={step2.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Nigerian Market Mockup Pack"
              maxLength={120}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Slug</label>
            <input
              type="text"
              value={step2.slug}
              onChange={(e) => setStep2((s) => ({ ...s, slug: e.target.value.toLowerCase() }))}
              placeholder="auto-generated from title"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
            />
            {step2.slug && !/^[a-z0-9-]+$/.test(step2.slug) && (
              <p className="mt-1 text-xs text-destructive">Slug may only contain lowercase letters, numbers, and hyphens.</p>
            )}
          </div>

          {/* Category + Creator */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                value={step2.category_id}
                onChange={(e) => setStep2((s) => ({ ...s, category_id: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
              >
                <option value="">Select category</option>
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
                value={step2.creator_id}
                onChange={(e) => setStep2((s) => ({ ...s, creator_id: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
              >
                <option value="">Select creator</option>
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
              value={step2.description}
              onChange={(e) => setStep2((s) => ({ ...s, description: e.target.value }))}
              placeholder="What's in this pack? Who's it for?"
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand-green-500 focus:ring-1 focus:ring-brand-green-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Tags</label>
            <input
              type="text"
              value={step2.tags}
              onChange={(e) => setStep2((s) => ({ ...s, tags: e.target.value }))}
              placeholder="mockup, branding, packaging (comma-separated)"
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
                    step2.compatible_software.includes(item)
                      ? "border-brand-green-600 bg-brand-green-50 text-brand-green-700 dark:bg-brand-green-950 dark:text-brand-green-400"
                      : "border-border bg-background text-muted-foreground hover:border-brand-green-400",
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* is_featured */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep2((s) => ({ ...s, is_featured: !s.is_featured }))}
              className={[
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                step2.is_featured
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  : "border-border bg-background text-muted-foreground hover:border-amber-400",
              ].join(" ")}
            >
              <Star className={`h-4 w-4 ${step2.is_featured ? "fill-amber-400 text-amber-400" : ""}`} />
              {step2.is_featured ? "Featured" : "Mark as featured"}
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep2()}
              className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              Next: Review
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review + Publish */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Preview card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {previewObjectUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewObjectUrl}
                alt="Preview"
                className="h-52 w-full object-cover"
              />
            )}
            <div className="p-5">
              <div className="mb-1 flex items-center gap-2">
                {step2.is_featured && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    <Star className="h-3 w-3 fill-amber-500" /> Featured
                  </span>
                )}
                {selectedCategory && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {selectedCategory.name}
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-heading text-lg font-semibold text-foreground">
                {step2.title || "Untitled"}
              </h2>
              {selectedCreator && (
                <p className="mt-0.5 text-sm text-muted-foreground">by {selectedCreator.name}</p>
              )}
              {step2.description && (
                <p className="mt-2 text-sm text-foreground/80 line-clamp-3">{step2.description}</p>
              )}
              {step2.tags && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {step2.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* File summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">File details</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Source file</dt>
              <dd className="text-foreground truncate">{step1.sourceFile?.name}</dd>
              <dt className="text-muted-foreground">File size</dt>
              <dd className="text-foreground">{step1.sourceFile ? formatBytes(step1.sourceFile.size) : "—"}</dd>
              <dt className="text-muted-foreground">File type</dt>
              <dd className="text-foreground font-mono">{step1.sourceFile?.type}</dd>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="text-foreground font-mono">{step2.slug}</dd>
            </dl>
          </div>

          {/* Status selector */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Publication status</p>
            <div className="grid grid-cols-2 gap-3">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPublishStatus(s)}
                  className={[
                    "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    publishStatus === s
                      ? "border-brand-green-600 bg-brand-green-50 dark:bg-brand-green-950"
                      : "border-border bg-background hover:border-brand-green-400",
                  ].join(" ")}
                >
                  <p className="font-semibold capitalize text-foreground">{s}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s === "published"
                      ? "Immediately visible in the catalogue"
                      : "Saved but not visible to subscribers"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-terracotta-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                publishStatus === "published" ? "Publish resource" : "Save as draft"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
