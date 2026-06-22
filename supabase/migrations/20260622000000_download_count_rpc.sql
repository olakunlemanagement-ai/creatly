-- Atomic download_count increment for the denormalised cache on resources.
-- Called best-effort after a successful download log insert.
-- SECURITY DEFINER so the function can update resources regardless of the caller's RLS context.
-- The downloads table remains the authoritative source of truth; this is a cache only.

CREATE OR REPLACE FUNCTION increment_download_count(p_resource_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE resources SET download_count = download_count + 1 WHERE id = p_resource_id;
$$;

-- Restrict execution to authenticated users only (avoids anonymous invocation).
REVOKE ALL ON FUNCTION increment_download_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_download_count(UUID) TO authenticated;
