"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Forwards a stray ?code= param to the real callback route handler.
// In normal flow the route.ts handler redirects before this page renders.
export function VerifyingInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const next = params.get("next") ?? "/onboarding";
    if (code) {
      router.replace(
        `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`,
      );
    }
  }, [params, router]);

  return null;
}
