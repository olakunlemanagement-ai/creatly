-- =====================================================================
-- Step 1.10.1: Creator-side data model
--
-- Changes:
--   1. creators.user_id  — link auth user ↔ catalogue creator entity
--   2. creator_profiles  — new table: public creator identity + status
--   3. resources review columns — review_status, rejection_reason,
--      submitted_at, reviewed_at, reviewed_by
--   4. Backfill review_status='approved' for existing published resources
--   5. is_creator() helper function
--   6. Updated RLS policies for resources, creators, creator_profiles
--   7. Storage policies for creator uploads
--
-- Lesson from 1.9.5: ADD COLUMN IF NOT EXISTS silently skips if the
-- column already exists. Verify each column landed below.
-- =====================================================================


-- =====================================================================
-- 1. ADD user_id to creators
--    Enables: creator_profiles.user_id → creators.user_id join
--    Also used by RLS subqueries: "creator sees own resources"
-- =====================================================================
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_creators_user_id
  ON public.creators(user_id);


-- =====================================================================
-- 2. CREATE creator_profiles
--    One row per self-onboarded creator. Distinct from the catalogue
--    `creators` table (which is the public-facing entity). The
--    application join: creator_profiles.user_id ↔ creators.user_id.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  user_id       uuid        PRIMARY KEY
                            REFERENCES auth.users(id) ON DELETE CASCADE,
  handle        text        NOT NULL UNIQUE
                            CHECK (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name  text        NOT NULL,
  bio           text,
  avatar_path   text,
  banner_path   text,
  location      text,
  website       text,
  socials       jsonb       NOT NULL DEFAULT '{}',
  -- status defaults to 'approved' (CREATOR_AUTO_APPROVE=true at launch).
  -- Flip to 'pending' when the flag is off; admin approves manually.
  status        text        NOT NULL DEFAULT 'approved'
                            CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_status
  ON public.creator_profiles(status);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_handle
  ON public.creator_profiles(handle);


-- =====================================================================
-- 3. ADD review columns to resources
--    IMPORTANT: verify each column landed (1.9.5 lesson).
--    The verification SELECT below will fail the migration if any
--    column is missing.
-- =====================================================================
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS review_status  text
    NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'submitted', 'approved', 'rejected'));

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS reviewed_at  timestamptz;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS reviewed_by  uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- Verify: fail the migration if any review column is missing.
DO $$
DECLARE missing_cols text[];
BEGIN
  SELECT ARRAY_AGG(col)
    INTO missing_cols
    FROM (VALUES
      ('review_status'), ('rejection_reason'),
      ('submitted_at'),  ('reviewed_at'), ('reviewed_by')
    ) AS expected(col)
    WHERE col NOT IN (
      SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'resources'
    );

  IF missing_cols IS NOT NULL THEN
    RAISE EXCEPTION 'resources is missing columns: %', missing_cols;
  END IF;
END $$;

-- Backfill: existing published resources were seeded by admin and are
-- approved by definition. Without this backfill the updated SELECT
-- policy (published AND approved) would hide all existing content.
UPDATE public.resources
  SET review_status = 'approved'
  WHERE status = 'published'
    AND review_status = 'draft';

CREATE INDEX IF NOT EXISTS idx_resources_review_status
  ON public.resources(review_status);


-- =====================================================================
-- 4. HELPER: is_creator()
--    Returns true when the calling user has a linked creators row.
--    Used in RLS policies — SECURITY DEFINER to avoid RLS recursion.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.is_creator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creators WHERE user_id = auth.uid()
  );
$$;


-- =====================================================================
-- 5. UPDATE RLS POLICIES
-- =====================================================================

-- ── resources ────────────────────────────────────────────────────────
-- Drop and recreate: original policy only gated on status='published'.
-- New rule: public sees published AND approved; creator sees own rows.

DROP POLICY IF EXISTS "resources: select" ON public.resources;
CREATE POLICY "resources: select"
  ON public.resources FOR SELECT
  USING (
    -- Public / anon: fully published and review-approved
    (status = 'published' AND review_status = 'approved')
    -- Creator: can see their own resources at any status
    OR creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
    -- Admin: all rows
    OR public.is_admin()
  );

-- Allow creators to INSERT their own resources (creator_id must match).
-- review_status cannot be 'approved' on insert — only admin/server can approve.
DROP POLICY IF EXISTS "resources: insert" ON public.resources;
CREATE POLICY "resources: insert"
  ON public.resources FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
      )
      AND review_status IN ('draft', 'submitted')
    )
  );

-- Creators can update their own resources but cannot self-approve.
DROP POLICY IF EXISTS "resources: update" ON public.resources;
CREATE POLICY "resources: update"
  ON public.resources FOR UPDATE
  USING (
    public.is_admin()
    OR creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  )
  WITH CHECK (
    -- Admin: any value
    public.is_admin()
    OR (
      -- Creator: can only set review_status to draft or submitted — not approved/rejected.
      creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
      AND review_status IN ('draft', 'submitted')
    )
  );

-- Delete: admin only (unchanged — recreate for clarity)
DROP POLICY IF EXISTS "resources: delete" ON public.resources;
CREATE POLICY "resources: delete"
  ON public.resources FOR DELETE
  USING (public.is_admin());


-- ── creators ─────────────────────────────────────────────────────────
-- Extend select so a creator can see their own row (even when is_public=false).
-- Extend update so a creator can edit their own catalogue entry.
-- Insert/delete remain admin-only (apply flow uses admin client).

DROP POLICY IF EXISTS "creators: select" ON public.creators;
CREATE POLICY "creators: select"
  ON public.creators FOR SELECT
  USING (is_public = true OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "creators: update" ON public.creators;
CREATE POLICY "creators: update"
  ON public.creators FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());


-- ── creator_profiles ─────────────────────────────────────────────────
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- Public / logged-in: see approved profiles; owner always sees their own.
CREATE POLICY "creator_profiles: select"
  ON public.creator_profiles FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

-- Owner: can create their own profile row (one per user enforced by PK).
CREATE POLICY "creator_profiles: insert"
  ON public.creator_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner: can update their own profile fields, but CANNOT change status.
-- Admin: can change anything, including status (approve/suspend).
CREATE POLICY "creator_profiles: update"
  ON public.creator_profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      -- Owner can update, but new status must equal current status —
      -- i.e., owner cannot escalate their own approval status.
      auth.uid() = user_id
      AND status = (
        SELECT cp.status FROM public.creator_profiles cp
         WHERE cp.user_id = auth.uid()
      )
    )
  );

-- No client DELETE for creator_profiles.


-- =====================================================================
-- 6. STORAGE POLICIES — creator uploads
--    Creators upload originals to resource-files/{user_id}/
--    and previews to resource-previews/{user_id}/
-- =====================================================================

-- resource-files: allow authenticated creator to INSERT under their user_id namespace.
CREATE POLICY "resource-files: creator insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resource-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_creator()
  );

-- resource-files: creator can read their own uploads (for managing drafts).
CREATE POLICY "resource-files: creator select own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_creator()
  );

-- resource-files: creator can delete their own draft files.
CREATE POLICY "resource-files: creator delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resource-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_creator()
  );

-- resource-previews: creator INSERT under their namespace.
CREATE POLICY "resource-previews: creator insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resource-previews'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_creator()
  );

-- resource-previews: creator can replace their own preview images.
CREATE POLICY "resource-previews: creator update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resource-previews'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.is_creator()
  );

-- creator-avatars: creators manage their own avatar.
CREATE POLICY "creator-avatars: creator insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'creator-avatars'
    AND name LIKE (auth.uid()::text || '.%')
    AND public.is_creator()
  );

CREATE POLICY "creator-avatars: creator update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'creator-avatars'
    AND name LIKE (auth.uid()::text || '.%')
    AND public.is_creator()
  );
