-- Migration: 20260621000002_fix_creators_rls_published_resources.sql
-- Step 1.4a: Allow reading creator rows if the creator has at least one published resource.
--
-- Decision: A creator's name is public once their work is publicly shown.
-- Internal/seed creators with no published resources remain unreadable by anon/authenticated.
--
-- We DROP the existing SELECT policy and recreate it — insert/update/delete policies are unchanged.

drop policy if exists "creators: select" on public.creators;

-- A creator row is readable if:
--   (a) is_public = true (Phase 2 publicly-onboarded creators), OR
--   (b) the caller is an admin, OR
--   (c) the creator has at least one published resource (their name is already public via the listing)
create policy "creators: select"
  on public.creators for select
  using (
    is_public = true
    or public.is_admin()
    or exists (
      select 1
      from public.resources r
      where r.creator_id = public.creators.id
        and r.status = 'published'
    )
  );
