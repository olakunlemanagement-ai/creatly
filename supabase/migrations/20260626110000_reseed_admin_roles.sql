-- =============================================================
-- Migration: re-seed admin_roles (idempotent)
--
-- Ensures the six system roles exist even if the original seed
-- from admin_rbac migration failed or was partially applied.
-- Uses ON CONFLICT (name) DO UPDATE so running twice is safe.
-- =============================================================

insert into public.admin_roles (name, label, description, permissions, is_system)
values
  ('super_admin',     'Super Admin',     'Full access to everything',
   ARRAY['*'], true),

  ('content_admin',   'Content Admin',   'Manages resources and categories',
   ARRAY['resources.read','resources.write','resources.delete',
         'categories.read','categories.write',
         'creators.read','review_queue.read','review_queue.write'], true),

  ('creator_admin',   'Creator Admin',   'Manages creators and their submissions',
   ARRAY['creators.read','creators.write',
         'review_queue.read','review_queue.write',
         'resources.read'], true),

  ('support_admin',   'Support Admin',   'Handles user support and account issues',
   ARRAY['users.read','users.write',
         'subscriptions.read',
         'notifications.write'], true),

  ('finance_admin',   'Finance Admin',   'Manages payments, subscriptions and earnings',
   ARRAY['subscriptions.read','subscriptions.write',
         'payments.read',
         'earnings.read','earnings.write',
         'payouts.read','payouts.write',
         'analytics.read'], true),

  ('analytics_admin', 'Analytics Admin', 'View-only access to analytics and reports',
   ARRAY['analytics.read','resources.read',
         'creators.read','subscriptions.read'], true)

on conflict (name) do update
  set label       = excluded.label,
      description = excluded.description,
      permissions = excluded.permissions,
      is_system   = excluded.is_system;

-- Re-seed the founding super_admin into admin_team if not already present.
-- This is idempotent due to the unique(user_id) constraint on admin_team.
insert into public.admin_team (user_id, role_id)
select
  p.id,
  ar.id
from public.profiles p
cross join public.admin_roles ar
where p.email = 'olakunle.management@gmail.com'
  and ar.name  = 'super_admin'
on conflict (user_id) do nothing;
