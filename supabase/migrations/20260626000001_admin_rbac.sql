-- =============================================================
-- Migration: permission-based RBAC — admin_roles + admin_team
--
-- Replaces the flat admin/super_admin role check with a
-- permission-set model. profiles.role stays for fast middleware
-- route-guarding; admin_team holds the granular role assignment.
-- =============================================================

-- 1. admin_roles — predefined permission sets (cannot be deleted if is_system = true)
create table public.admin_roles (
  id          uuid        primary key default gen_random_uuid(),
  name        text        unique not null,
  label       text        not null,
  description text,
  permissions text[]      not null default '{}',
  is_system   boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- 2. admin_team — maps auth users to a single admin role
create table public.admin_team (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  role_id     uuid        not null references public.admin_roles,
  invited_by  uuid        references auth.users,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

-- Fast look-up: find a user's admin_team row
create index admin_team_user_id_idx on public.admin_team(user_id);

-- 3. Seed the six system roles
insert into public.admin_roles (name, label, description, permissions, is_system) values
('super_admin', 'Super Admin', 'Full access to everything',
 ARRAY['*'], true),

('content_admin', 'Content Admin', 'Manages resources and categories',
 ARRAY['resources.read','resources.write','resources.delete',
       'categories.read','categories.write',
       'creators.read','review_queue.read','review_queue.write'], true),

('creator_admin', 'Creator Admin', 'Manages creators and their submissions',
 ARRAY['creators.read','creators.write',
       'review_queue.read','review_queue.write',
       'resources.read'], true),

('support_admin', 'Support Admin', 'Handles user support and account issues',
 ARRAY['users.read','users.write',
       'subscriptions.read',
       'notifications.write'], true),

('finance_admin', 'Finance Admin', 'Manages payments, subscriptions and earnings',
 ARRAY['subscriptions.read','subscriptions.write',
       'payments.read',
       'earnings.read','earnings.write',
       'payouts.read','payouts.write',
       'analytics.read'], true),

('analytics_admin', 'Analytics Admin', 'View-only access to analytics and reports',
 ARRAY['analytics.read','resources.read',
       'creators.read','subscriptions.read'], true);

-- 4. Add role_id to admin_invites so the invited role is carried to acceptance
alter table public.admin_invites
  add column role_id uuid references public.admin_roles;

-- 5. RLS
alter table public.admin_roles enable row level security;
alter table public.admin_team  enable row level security;

-- Any admin can read roles (needed for invite form dropdown)
create policy "admin_read_roles"
  on public.admin_roles for select
  using (public.is_admin());

-- Any admin can read the team
create policy "admin_read_team"
  on public.admin_team for select
  using (public.is_admin());

-- Only a super_admin (via admin_team.role with permissions = '{*}') can write admin_team.
-- Service-role bypasses this, so invite acceptance (which uses admin client) is unblocked.
create policy "super_admin_write_team"
  on public.admin_team for all
  using (
    exists (
      select 1 from public.admin_team at2
      join public.admin_roles ar on ar.id = at2.role_id
      where at2.user_id = auth.uid()
        and '*' = any(ar.permissions)
    )
  );

-- 6. Seed the founding super_admin into admin_team
--    profiles.role = 'super_admin' was set by the previous migration.
insert into public.admin_team (user_id, role_id)
select
  p.id,
  ar.id
from public.profiles p
cross join public.admin_roles ar
where p.email = 'olakunle.management@gmail.com'
  and ar.name  = 'super_admin';
