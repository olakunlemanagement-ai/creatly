import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { VerifyingInner } from "./VerifyingInner";

// Branded loading screen shown for the split-second during PKCE exchange.
// useSearchParams requires a Suspense boundary in Next.js App Router.
export default function VerifyingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream-50 px-5">
      <Logo variant="mark" tone="ink" size={48} />

      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {"// Verifying your email…"}
      </p>

      <svg
        className="h-5 w-5 animate-spin text-terracotta-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>

      <Suspense>
        <VerifyingInner />
      </Suspense>
    </div>
  );
}
