"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { sendSupportMessage, SUBJECT_OPTIONS } from "@/lib/actions/support";
import type { ContactState } from "@/lib/actions/support";

const init: ContactState | null = null;

export function ContactForm() {
  const [state, action, pending] = useActionState(sendSupportMessage, init);

  if (state?.ok) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand-green-700/30 bg-brand-green-700/8 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-green-700" />
        <p className="text-sm font-medium text-brand-green-700">
          Message sent — we&apos;ll get back to you within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          SUBJECT
        </label>
        <select
          id="subject"
          name="subject"
          required
          defaultValue=""
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
        >
          <option value="" disabled>Choose a topic…</option>
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          MESSAGE
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="Describe your issue or question…"
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state?.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Send message
      </button>
    </form>
  );
}
