-- Add a stored generated tsvector column for full-text search on resources.
-- The previous idx_resources_fts was an expression index, which PostgREST cannot
-- target via column-name filters. A stored generated column lets the Supabase JS
-- client call textSearch('fts', ...) and lets OR filters reference it by name.
ALTER TABLE public.resources
  ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

-- Replace the old expression index with a column index on the new fts field.
DROP INDEX IF EXISTS idx_resources_fts;
CREATE INDEX idx_resources_fts ON public.resources USING gin(fts);
