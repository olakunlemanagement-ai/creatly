import { z } from "zod";

// Validated at import time. The app fails to boot if a required var is missing.
// Add vars here as each step introduces them — never leave unvalidated env access elsewhere.

const envSchema = z.object({
  // ── Supabase ────────────────────────────────────────────────────────────────
  // Required from step 1.2 (DB + auth setup)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ── Paystack ────────────────────────────────────────────────────────────────
  // TODO(step-2.1): uncomment when adding payment integration
  // PAYSTACK_SECRET_KEY: z.string().min(1),
  // PAYSTACK_PLAN_PERSONAL_MONTHLY: z.string().min(1),
  // PAYSTACK_PLAN_PERSONAL_ANNUAL: z.string().min(1),
  // PAYSTACK_PLAN_TEAM_MONTHLY: z.string().min(1),
  // PAYSTACK_PLAN_TEAM_ANNUAL: z.string().min(1),

  // ── Resend ──────────────────────────────────────────────────────────────────
  // TODO(step-3.x): uncomment when adding email integration
  // RESEND_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
