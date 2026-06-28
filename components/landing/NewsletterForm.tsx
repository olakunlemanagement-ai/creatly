"use client";

import { useActionState, useEffect, useRef } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { Loader2 } from "lucide-react";

interface NewsletterFormProps {
  source?: "footer" | "landing" | "pricing";
}

export function NewsletterForm({ source = "footer" }: NewsletterFormProps) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear input on success
  useEffect(() => {
    if (state?.ok && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [state]);

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-cream-100 placeholder:text-cream-300/40 focus:outline-none focus:ring-2 focus:ring-terracotta-500/60"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-terracotta-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>

      {state && (
        <p
          className={`mt-2 text-xs ${
            state.ok ? "text-green-400" : "text-terracotta-400"
          }`}
          role="status"
          aria-live="polite"
        >
          {state.ok ? "You're subscribed!" : state.error}
        </p>
      )}
    </form>
  );
}
