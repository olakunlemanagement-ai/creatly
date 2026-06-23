import { z } from "zod";

// Validated at import time — server side only. App fails to boot if any required var is missing.
// NEXT_PUBLIC_ vars are also statically inlined by Next.js into the browser bundle at build time.
// Non-NEXT_PUBLIC_ vars must NEVER be imported into client-facing code; they will be undefined in the browser.

const envSchema = z.object({
  // ── Supabase ────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // Publishable key (sb_publishable_…) — safe for browser; used by browser and server clients.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Secret key (sb_secret_…) — SERVER ONLY. Bypasses RLS. Never expose to the browser.
  // Only the Paystack webhook handler (lib/supabase/admin.ts) may use this.
  SUPABASE_SECRET_KEY: z.string().min(1),

  // ── Paystack ────────────────────────────────────────────────────────────────
  // TODO(step-2.1): uncomment when adding payment integration
  // PAYSTACK_SECRET_KEY: z.string().min(1),
  // PAYSTACK_PLAN_PERSONAL_MONTHLY: z.string().min(1),
  // PAYSTACK_PLAN_PERSONAL_ANNUAL: z.string().min(1),
  // PAYSTACK_PLAN_TEAM_MONTHLY: z.string().min(1),
  // PAYSTACK_PLAN_TEAM_ANNUAL: z.string().min(1),

  // ── Resend ──────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
