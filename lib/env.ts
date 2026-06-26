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
  // SERVER ONLY — never expose PAYSTACK_SECRET_KEY to the client.
  PAYSTACK_SECRET_KEY: z.string().min(1),
  // Client-safe publishable key — used by Paystack Inline.js for card forms.
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1),

  // ── App URL ─────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),

  // ── Resend ──────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1),

  // ── Creator flags ───────────────────────────────────────────────────────────
  // When 'true' (default), creators and uploads are auto-approved on submit.
  // Flip to 'false' to require admin review (zero code change needed).
  CREATOR_AUTO_APPROVE: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v !== "false"),

  // ── Sentry ──────────────────────────────────────────────────────────────────
  // Optional in dev; required in production for error monitoring.
  // BLOCKER: obtain DSN from sentry.io → Project → Settings → Client Keys.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Token that gates /api/sentry-test in all environments. Set in .env.local / Vercel env.
  // Defaults to a build-time random string so the route is never publicly guessable.
  SENTRY_TEST_TOKEN: z
    .string()
    .optional()
    .default(() => Math.random().toString(36).slice(2)),
});

export const env = envSchema.parse(process.env);
