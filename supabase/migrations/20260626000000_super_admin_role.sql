-- =============================================================
-- Migration: super_admin role + admin invite system
--
-- Changes:
--  1. Widen profiles.role check constraint to include 'super_admin'.
--  2. Update is_admin() to treat super_admin as an admin.
--  3. Create admin_invites table for email-based admin onboarding.
--  4. Promote olakunle.management@gmail.com to super_admin.
-- =============================================================

-- 1. Widen the role check constraint
alter table public.profiles
  drop constraint profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'creator', 'admin', 'super_admin'));

-- 2. Update is_admin() so super_admin inherits all admin access.
--    SECURITY DEFINER so it runs as postgres (superuser → bypasses RLS).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 3. Admin invite table
--    Rows are created by super_admin and consumed exactly once.
create table public.admin_invites (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  -- 64-char hex token generated server-side before insert
  token       text        not null unique,
  invited_by  uuid        not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_at     timestamptz
);

-- Index for fast token look-ups on the accept page
create index admin_invites_token_idx on public.admin_invites(token);

-- RLS: only super_admin can manage invites.
-- The accept-invite server action uses the admin client (service_role)
-- to validate and consume a token, so it never hits these policies.
alter table public.admin_invites enable row level security;

create policy "super_admin can manage own invites"
  on public.admin_invites
  for all
  using (
    (select role = 'super_admin' from public.profiles where id = auth.uid())
  )
  with check (
    (select role = 'super_admin' from public.profiles where id = auth.uid())
  );

-- 4. Promote the founding super_admin
update public.profiles
  set role = 'super_admin'
  where email = 'olakunle.management@gmail.com';
