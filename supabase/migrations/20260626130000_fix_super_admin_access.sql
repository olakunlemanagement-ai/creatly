-- =============================================================
-- Migration: ensure super_admin has wildcard permissions and
--            founding admin is in admin_team with that role.
--
-- Idempotent. Safe to run multiple times.
-- =============================================================

-- 1. Force super_admin permissions to wildcard (fixes empty-array edge case)
update public.admin_roles
set permissions = ARRAY['*']
where name = 'super_admin';

-- 2. Ensure founding super_admin is in admin_team with the correct role.
--    Uses DO UPDATE so an existing row pointing at a broken role is corrected.
insert into public.admin_team (user_id, role_id)
select p.id, ar.id
from public.profiles p
cross join public.admin_roles ar
where p.email = 'olakunle.management@gmail.com'
  and ar.name  = 'super_admin'
on conflict (user_id) do update
  set role_id = excluded.role_id;
