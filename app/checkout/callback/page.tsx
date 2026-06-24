"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { APP_NAME } from "@/lib/config";

type VerifyState = "polling" | "success" | "failed" | "timeout";

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

export default function CheckoutCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const isStub = searchParams.get("stub") === "true";

  const [state, setState] = useState<VerifyState>("polling");
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!reference) {
      setState("failed");
      return;
    }

    // Stub mode: simulate success for development without real Paystack keys
    if (isStub) {
      const t = setTimeout(() => {
        setState("success");
        setTimeout(() => router.push("/dashboard?subscribed=1"), 1500);
      }, 1200);
      return () => clearTimeout(t);
    }

    // Real mode: poll the verify endpoint until the webhook has updated the status
    const poll = async () => {
      if (attemptRef.current >= MAX_ATTEMPTS) {
        setState("timeout");
        return;
      }
      attemptRef.current += 1;

      try {
        const res = await fetch(`/api/checkout/verify?reference=${reference}`);
        if (!res.ok) {
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        const data = (await res.json()) as { ok: boolean; data?: { status: string } };
        const status = data.data?.status;

        if (status === "success") {
          setState("success");
          setTimeout(() => router.push("/dashboard?subscribed=1"), 1500);
        } else if (status === "failed") {
          setState("failed");
        } else {
          // Still "pending" — try again
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    const t = setTimeout(poll, POLL_INTERVAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, isStub]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      {state === "polling" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-brand-green-700" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Verifying your payment…
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This only takes a moment. Please don&apos;t close this page.
            </p>
          </div>
        </>
      )}

      {state === "success" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-brand-green-600" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Subscription activated!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome to {APP_NAME}. Redirecting to your dashboard…
            </p>
          </div>
        </>
      )}

      {state === "failed" && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Payment failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment could not be completed. You have not been charged.
            </p>
          </div>
          <a
            href="/pricing"
            className="rounded-xl bg-brand-green-700 px-6 py-3 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800"
          >
            Try again
          </a>
        </>
      )}

      {state === "timeout" && (
        <>
          <Loader2 className="h-10 w-10 text-muted-foreground" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Still processing…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment is taking longer than expected. Check your billing page in a moment.
            </p>
          </div>
          <a
            href="/billing"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Go to billing
          </a>
        </>
      )}
    </div>
  );
}
