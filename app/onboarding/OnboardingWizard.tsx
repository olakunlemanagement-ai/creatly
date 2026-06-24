"use client";

import { useState, useTransition } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { completeOnboarding } from "@/lib/actions/onboarding";
import type { Category } from "@/types/database";

interface OnboardingWizardProps {
  categories: Pick<Category, "id" | "name">[];
}

const TOTAL_STEPS = 3;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
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
          {step < TOTAL_STEPS && (
            <div
              className={[
                "h-px w-8 transition-colors",
                step < current ? "bg-brand-green-600" : "bg-border",
              ].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function OnboardingWizard({ categories }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function handleComplete() {
    setServerError(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        interest_ids: selectedInterests,
        display_name: displayName || undefined,
      });
      if (result?.error) {
        setServerError(result.error);
      }
      // On success, the server action calls redirect() — no client-side nav needed
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      {/* Top bar */}
      <div className="border-b border-border bg-background px-6 py-4">
        <Logo variant="full" tone="ink" size={28} />
      </div>

      {/* Wizard content */}
      <div className="flex flex-1 items-start justify-center px-5 py-12">
        <div className="w-full max-w-[480px] space-y-8">

          {/* Step indicator */}
          <div className="flex items-center justify-between">
            <StepIndicator current={step} />
            <span className="font-mono text-xs text-muted-foreground">
              {String(step).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
            </span>
          </div>

          {/* ── Step 1: Interests ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {"// Personalise"}
                </p>
                <h1
                  className="mt-2 font-heading text-3xl text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  What do you work on?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select the resource types you use most. Pick as many as you like.
                </p>
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = selectedInterests.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleInterest(cat.id)}
                        className={[
                          "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                          selected
                            ? "border-terracotta-500 bg-terracotta-500 text-white"
                            : "border-border bg-card text-foreground hover:border-terracotta-300",
                        ].join(" ")}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Display name ───────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {"// Your profile"}
                </p>
                <h1
                  className="mt-2 font-heading text-3xl text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  What should we call you?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is how you&apos;ll appear on your profile and download history.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="display-name"
                  className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Display name (optional)
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  placeholder="Ada Okafor"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {"// All set"}
                </p>
                <h1
                  className="mt-2 font-heading text-3xl text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Ready to create.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Thousands of templates, fonts, mockups, and motion assets — curated for African creatives. Start exploring.
                </p>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-border bg-card p-4 text-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Your setup
                </p>
                <div className="mt-3 space-y-2">
                  {selectedInterests.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interests</span>
                      <span className="font-medium text-foreground">{selectedInterests.length} selected</span>
                    </div>
                  )}
                  {displayName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Display name</span>
                      <span className="font-medium text-foreground">{displayName}</span>
                    </div>
                  )}
                </div>
              </div>

              {serverError && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                >
                  {isPending ? "Saving…" : "Browse resources →"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
