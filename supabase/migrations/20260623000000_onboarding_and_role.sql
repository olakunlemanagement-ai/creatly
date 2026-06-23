-- ============================================================
-- Migration 1.9.5 — Onboarding flag and role column on profiles
-- ============================================================
-- Adds the columns needed by the post-signup onboarding wizard.
-- These do NOT modify any 1.2b/1.3 migration files — added here as a
-- standalone, self-contained migration.

-- Add onboarded flag: false until the user completes the onboarding wizard.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Add role column: 'consumer' by default; set to 'creator' via the wizard.
-- 'admin' may only be set server-side (service role); never by a client.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'consumer'
    CHECK (role IN ('consumer', 'creator', 'admin'));

-- ── RLS guardrail: prevent direct client self-assignment of admin ──────────
-- Column-level RLS doesn't exist in Postgres, so we use a row-level function
-- trigger to enforce that a user cannot set their own role to 'admin'.
-- The server action (lib/actions/onboarding.ts) also validates role is only
-- 'consumer' or 'creator' — this trigger is defence in depth.

CREATE OR REPLACE FUNCTION public.guard_profile_role_self_assign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service-role connections (webhooks) may set admin; reject for normal auth users.
  IF (current_setting('role', true) = 'authenticated') AND NEW.role = 'admin' AND OLD.role <> 'admin' THEN
    RAISE EXCEPTION 'Cannot self-assign admin role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_role_self_assign ON public.profiles;
CREATE TRIGGER trg_guard_profile_role_self_assign
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_role_self_assign();

-- ── Index for efficient onboarding-status lookups (optional, small table) ─
CREATE INDEX IF NOT EXISTS idx_profiles_onboarded
  ON public.profiles (onboarded)
  WHERE onboarded = false;
