import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Auth error — ${APP_NAME}`,
};

interface ErrorState {
  label: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  showSecondary: boolean;
}

const ERROR_STATES: Record<string, ErrorState> = {
  missing_token: {
    label: "// Invalid link",
    title: "Invalid link",
    description: "This verification link is invalid or has already been used. Please sign up again to get a fresh link.",
    primaryLabel: "Sign up again",
    primaryHref: "/signup",
    showSecondary: true,
  },
  link_expired: {
    label: "// Link expired",
    title: "Link expired",
    description: "Your verification link has expired. Email links are valid for 24 hours — request a new one.",
    primaryLabel: "Resend verification",
    primaryHref: "/signup",
    showSecondary: true,
  },
};

const DEFAULT_ERROR: ErrorState = {
  label: "// Unexpected error",
  title: "Something went wrong",
  description: "An unexpected error occurred with this link. You can try again from the home page.",
  primaryLabel: "Go home",
  primaryHref: "/",
  showSecondary: false,
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const state = ERROR_STATES[reason ?? ""] ?? DEFAULT_ERROR;

  return (
    <div className="flex min-h-screen">

      {/* ── Left: content column ─────────────────────────────── */}
      <div className="flex flex-1 flex-col">

        {/* Mobile brand header (hidden on desktop) */}
        <div className="flex items-center gap-3 border-b border-brand-green-800 bg-brand-green-900 px-5 py-4 lg:hidden">
          <Link href="/" aria-label="Home">
            <Logo variant="full" tone="cream" size={26} />
          </Link>
        </div>

        {/* Error content */}
        <div className="flex flex-1 items-center justify-center bg-cream-50 px-5 py-12">
          <div className="w-full max-w-[400px] space-y-8">

            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-100">
              <AlertCircle className="h-6 w-6 text-terracotta-500" />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {state.label}
              </p>
              <h1
                className="font-heading text-3xl text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {state.title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {state.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href={state.primaryHref}
                className="flex w-full items-center justify-center rounded-xl bg-terracotta-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
              >
                {state.primaryLabel}
              </Link>
              {state.showSecondary && (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  Back to login
                </Link>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ── Right: brand panel (desktop only) ────────────────── */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[48%]">
        <AuthBrandPanel />
      </div>

    </div>
  );
}
