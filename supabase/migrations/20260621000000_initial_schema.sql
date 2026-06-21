-- =====================================================================
-- Migration: 20260621000000_initial_schema.sql
-- Step 1.2b: Full schema, RLS, storage buckets
--
-- Tables (12): profiles, creators, categories, resources,
--   subscriptions, subscription_events, team_members, downloads,
--   favourites, notifications, notification_preferences, category_follows
--
-- Guardrails enforced here:
--   - Money columns are INTEGER (kobo). No float, no numeric.
--   - downloads + subscription_events are append-only (immutable).
--     Enforced at TWO levels: (1) no UPDATE/DELETE RLS policies,
--     (2) UPDATE/DELETE grants revoked from authenticated + anon.
--   - RLS enabled on every table. Service_role bypasses RLS and is
--     the only writer for subscriptions, subscription_events,
--     and notifications.
-- =====================================================================


-- =====================================================================
-- PROFILES
-- One row per auth.users row. Auto-created by trigger below.
-- =====================================================================
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text        not null,
  full_name     text,
  avatar_path   text,                            -- Supabase Storage path in avatars/
  role          text        not null default 'user'
                            check (role in ('user', 'admin', 'creator')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profiles row when a new auth.users row is inserted.
-- SECURITY DEFINER: runs as function owner to bypass profiles RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =====================================================================
-- HELPER: public.is_admin()
--
-- Defined here (after profiles) because language sql bodies are validated
-- at creation time — profiles must exist before this function is compiled.
--
-- SECURITY DEFINER makes this function execute as its OWNER, not the
-- caller. Supabase migrations run as the postgres superuser, so this
-- function is owned by postgres. PostgreSQL superusers bypass RLS
-- unconditionally — so the SELECT below never evaluates profiles RLS
-- policies, eliminating any risk of infinite recursion.
--
-- Why not JWT claims (auth.jwt()->'app_metadata'->>'role')?
-- JWT claims require Supabase Auth to set app_metadata and don't
-- reflect role changes until the user re-authenticates. The DB-query
-- approach keeps profiles as the single source of truth and takes
-- effect immediately when a role is changed by an admin.
--
-- Returns false for unauthenticated callers (auth.uid() is null).
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;


-- =====================================================================
-- CREATORS
-- is_public = false for internal/seed creators (Phase 1).
-- is_public = true for Phase 2 publicly-onboarded creators.
-- =====================================================================
create table public.creators (
  id            uuid        primary key default gen_random_uuid(),
  profile_id    uuid        references public.profiles(id) on delete set null,
  name          text        not null,
  slug          text        not null unique,
  bio           text,
  avatar_path   text,                            -- Supabase Storage path in creator-avatars/
  website_url   text,
  is_public     boolean     not null default false,
  is_verified   boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- =====================================================================
-- CATEGORIES
-- =====================================================================
create table public.categories (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,
  slug          text        not null unique,
  description   text,
  icon_name     text,                            -- lucide icon name or emoji
  sort_order    integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);


-- =====================================================================
-- RESOURCES
-- =====================================================================
create table public.resources (
  id                  uuid        primary key default gen_random_uuid(),
  creator_id          uuid        not null references public.creators(id),
  category_id         uuid        not null references public.categories(id),
  title               text        not null,
  slug                text        not null unique,
  description         text,
  tags                text[]      not null default '{}',
  compatible_software text[]      not null default '{}',     -- ['figma', 'canva', ...]

  -- Downloadable file (stored in resource-files/ private bucket)
  file_path           text        not null,                  -- Storage path
  file_name           text        not null,                  -- display name shown to user
  file_size_bytes     bigint      not null,
  file_type           text        not null,                  -- MIME type

  -- Preview images (stored in resource-previews/ public bucket)
  preview_image_path  text        not null,                  -- primary (catalogue cards)
  preview_images      text[]      not null default '{}',     -- additional previews (max 5)

  -- Status & discovery
  status              text        not null default 'draft'
                                  check (status in ('draft', 'published', 'archived')),
  is_featured         boolean     not null default false,
  download_count      integer     not null default 0,        -- denormalised cache; downloads table is authoritative

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_resources_category_id  on public.resources(category_id);
create index idx_resources_creator_id   on public.resources(creator_id);
create index idx_resources_status       on public.resources(status);
create index idx_resources_created_at   on public.resources(created_at desc);
create index idx_resources_tags         on public.resources using gin(tags);
create index idx_resources_compat_sw    on public.resources using gin(compatible_software);
-- Full-text search across title and description
create index idx_resources_fts          on public.resources
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));


-- =====================================================================
-- SUBSCRIPTIONS
-- All writes come from the Paystack webhook handler via service_role.
-- amount_kobo: INTEGER (kobo = minor units). 1 NGN = 100 kobo. Never float.
-- =====================================================================
create table public.subscriptions (
  id                   uuid        primary key default gen_random_uuid(),
  owner_id             uuid        not null references public.profiles(id),

  -- Paystack references
  paystack_customer_id text,
  paystack_sub_code    text        unique,                   -- Paystack subscription code
  paystack_plan_code   text,                                 -- Paystack plan code

  -- Plan
  plan_type            text        not null
                                   check (plan_type in ('personal_monthly', 'personal_annual', 'team_monthly', 'team_annual')),
  max_seats            integer     not null default 1,       -- 1 personal, 5 team
  amount_kobo          integer     not null,                 -- recurring charge in kobo (INTEGER — never float)
  currency             text        not null default 'NGN',

  -- Status — driven by webhooks only, never set from client callbacks
  status               text        not null default 'pending'
                                   check (status in ('pending', 'active', 'past_due', 'cancelled', 'expired')),

  -- Period dates
  current_period_start timestamptz,
  current_period_end   timestamptz,
  trial_ends_at        timestamptz,
  cancelled_at         timestamptz,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_subscriptions_owner_id on public.subscriptions(owner_id);
create index idx_subscriptions_status   on public.subscriptions(status);


-- =====================================================================
-- SUBSCRIPTION EVENTS (immutable audit log)
-- Append-only — no UPDATE, no DELETE for any client-reachable role.
-- paystack_ref unique partial index enforces webhook idempotency:
-- inserting the same ref twice will fail, preventing double-processing.
-- =====================================================================
create table public.subscription_events (
  id              uuid        primary key default gen_random_uuid(),
  subscription_id uuid        references public.subscriptions(id),
  paystack_event  text        not null,                      -- e.g. 'charge.success'
  paystack_ref    text,                                      -- Paystack transaction ref (idempotency key)
  payload         jsonb,                                     -- full Paystack webhook payload
  processed_at    timestamptz not null default now()
);

-- Unique partial index: prevents processing the same Paystack event twice.
create unique index idx_sub_events_paystack_ref
  on public.subscription_events(paystack_ref)
  where paystack_ref is not null;


-- =====================================================================
-- TEAM MEMBERS
-- =====================================================================
create table public.team_members (
  id              uuid        primary key default gen_random_uuid(),
  subscription_id uuid        not null references public.subscriptions(id) on delete cascade,
  profile_id      uuid        not null references public.profiles(id) on delete cascade,
  role            text        not null default 'member' check (role in ('owner', 'member')),
  invited_email   text,
  invite_token    text        unique,
  invite_accepted boolean     not null default false,
  invited_at      timestamptz not null default now(),
  accepted_at     timestamptz,
  unique (subscription_id, profile_id)
);


-- =====================================================================
-- DOWNLOADS (immutable — append only, never update or delete)
-- creator_id is denormalised from the resource at download time.
-- It is NEVER updated even if the resource is later reassigned.
-- This guarantees attribution integrity for all historical downloads.
-- =====================================================================
create table public.downloads (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id),
  resource_id     uuid        not null references public.resources(id),
  creator_id      uuid        not null,                      -- denormalised from resource.creator_id at download time
  subscription_id uuid        references public.subscriptions(id),
  plan_type       text,                                      -- denormalised: plan type at download time
  downloaded_at   timestamptz not null default now()
  -- No updated_at — this table is append-only by design.
);

create index idx_downloads_user_id         on public.downloads(user_id);
create index idx_downloads_resource_id     on public.downloads(resource_id);
create index idx_downloads_creator_id      on public.downloads(creator_id);
create index idx_downloads_downloaded_at   on public.downloads(downloaded_at desc);
create index idx_downloads_subscription_id on public.downloads(subscription_id);


-- =====================================================================
-- FAVOURITES
-- =====================================================================
create table public.favourites (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  resource_id uuid        not null references public.resources(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, resource_id)
);

create index idx_favourites_user_id on public.favourites(user_id);


-- =====================================================================
-- NOTIFICATIONS
-- Rows inserted server-side via service_role. No client INSERT policy.
-- =====================================================================
create table public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  type       text        not null,                           -- notification type ID from spec
  title      text        not null,
  body       text        not null,
  action_url text,                                          -- optional deep link
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
-- Partial index for fast unread count queries
create index idx_notifications_unread on public.notifications(user_id, is_read)
  where is_read = false;


-- =====================================================================
-- NOTIFICATION PREFERENCES
-- One row per user. Created on signup (step 1.3 will wire the trigger).
-- =====================================================================
create table public.notification_preferences (
  id                        uuid        primary key default gen_random_uuid(),
  user_id                   uuid        not null unique references public.profiles(id) on delete cascade,
  email_subscription_events boolean     not null default true,
  email_renewal_reminders   boolean     not null default true,
  email_payment_failed      boolean     not null default true,
  email_team_events         boolean     not null default true,
  email_new_resources       boolean     not null default true,
  email_new_resources_freq  text        not null default 'weekly'
                                        check (email_new_resources_freq in ('daily', 'weekly', 'never')),
  updated_at                timestamptz not null default now()
);


-- =====================================================================
-- CATEGORY FOLLOWS (drives new-resource digest notifications)
-- =====================================================================
create table public.category_follows (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  category_id uuid        not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, category_id)
);


-- =====================================================================
-- ROW-LEVEL SECURITY
-- Enabled on all 12 tables. Defence in depth: the application layer
-- checks permissions AND the database enforces them independently.
-- =====================================================================
alter table public.profiles                 enable row level security;
alter table public.creators                 enable row level security;
alter table public.categories               enable row level security;
alter table public.resources                enable row level security;
alter table public.subscriptions            enable row level security;
alter table public.subscription_events      enable row level security;
alter table public.team_members             enable row level security;
alter table public.downloads                enable row level security;
alter table public.favourites               enable row level security;
alter table public.notifications            enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.category_follows         enable row level security;


-- =====================================================================
-- RLS POLICIES — PROFILES
-- Read:   own row; admin all
-- Update: own row; admin any
-- Insert: none (handle_new_user trigger, security definer)
-- Delete: none (cascades from auth.users deletion only)
-- =====================================================================
create policy "profiles: select"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: update"
  on public.profiles for update
  using  (auth.uid() = id or public.is_admin())
  with check (
    -- Admins can set any value, including changing another user's role.
    public.is_admin()
    or (
      -- Non-admins can update their own row but cannot escalate their role.
      -- 'role' here is the NEW value being written.
      -- The subquery reads the CURRENT (pre-update) value from the DB.
      -- If the caller attempts a role change, new != old and this check fails.
      auth.uid() = id
      and role = (select p.role from public.profiles p where p.id = auth.uid())
    )
  );


-- =====================================================================
-- RLS POLICIES — CREATORS
-- Read:   public if is_public = true; admin all
-- Write:  admin only
-- =====================================================================
create policy "creators: select"
  on public.creators for select
  using (is_public = true or public.is_admin());

create policy "creators: insert"
  on public.creators for insert
  with check (public.is_admin());

create policy "creators: update"
  on public.creators for update
  using (public.is_admin());

create policy "creators: delete"
  on public.creators for delete
  using (public.is_admin());


-- =====================================================================
-- RLS POLICIES — CATEGORIES
-- Read:   public if is_active = true; admin all
-- Write:  admin only
-- =====================================================================
create policy "categories: select"
  on public.categories for select
  using (is_active = true or public.is_admin());

create policy "categories: insert"
  on public.categories for insert
  with check (public.is_admin());

create policy "categories: update"
  on public.categories for update
  using (public.is_admin());

create policy "categories: delete"
  on public.categories for delete
  using (public.is_admin());


-- =====================================================================
-- RLS POLICIES — RESOURCES
-- Read:   public if status = 'published'; admin all
-- Write:  admin only (soft-delete via status = 'archived', not hard delete)
-- =====================================================================
create policy "resources: select"
  on public.resources for select
  using (status = 'published' or public.is_admin());

create policy "resources: insert"
  on public.resources for insert
  with check (public.is_admin());

create policy "resources: update"
  on public.resources for update
  using (public.is_admin());

create policy "resources: delete"
  on public.resources for delete
  using (public.is_admin());


-- =====================================================================
-- RLS POLICIES — SUBSCRIPTIONS
-- Read:   subscription owner; admin all
-- Write:  NO policies — only service_role (webhook handler) writes here.
--         service_role bypasses RLS, so no INSERT/UPDATE policy needed.
--         Authenticated users cannot write to subscriptions at all.
-- =====================================================================
create policy "subscriptions: select"
  on public.subscriptions for select
  using (auth.uid() = owner_id or public.is_admin());


-- =====================================================================
-- RLS POLICIES — SUBSCRIPTION EVENTS
-- Read:   admin all
-- Write:  NO policies — service_role only. UPDATE/DELETE blocked below.
-- =====================================================================
create policy "subscription_events: select"
  on public.subscription_events for select
  using (public.is_admin());


-- =====================================================================
-- RLS POLICIES — TEAM MEMBERS
-- Read:   subscription owner OR any member of the same team
-- Insert: subscription owner (to send invites)
-- Update: subscription owner (any row) OR the member themselves (self-accept)
-- Delete: subscription owner only
-- =====================================================================
create policy "team_members: select"
  on public.team_members for select
  using (
    -- Subscription owner can see all members
    exists (
      select 1 from public.subscriptions s
      where s.id = team_members.subscription_id
        and s.owner_id = auth.uid()
    )
    or
    -- Any team member can see others in the same team
    exists (
      select 1 from public.team_members tm
      where tm.subscription_id = team_members.subscription_id
        and tm.profile_id = auth.uid()
    )
  );

create policy "team_members: insert"
  on public.team_members for insert
  with check (
    exists (
      select 1 from public.subscriptions s
      where s.id = team_members.subscription_id
        and s.owner_id = auth.uid()
    )
  );

create policy "team_members: update"
  on public.team_members for update
  using (
    -- Owner can update any member row
    exists (
      select 1 from public.subscriptions s
      where s.id = team_members.subscription_id
        and s.owner_id = auth.uid()
    )
    or
    -- Member can update their own row (accepting invite)
    auth.uid() = profile_id
  );

create policy "team_members: delete"
  on public.team_members for delete
  using (
    exists (
      select 1 from public.subscriptions s
      where s.id = team_members.subscription_id
        and s.owner_id = auth.uid()
    )
  );


-- =====================================================================
-- RLS POLICIES — DOWNLOADS (CRITICAL — immutable table)
-- Read:   own rows; admin all
-- Insert: authenticated users, own user_id only.
--         Entitlement (subscription check) is enforced at the app layer
--         before the insert. The DB just verifies user_id = auth.uid().
-- UPDATE: NO policy — intentionally blocked. See revoke below.
-- DELETE: NO policy — intentionally blocked. See revoke below.
-- =====================================================================
create policy "downloads: select"
  on public.downloads for select
  using (auth.uid() = user_id or public.is_admin());

create policy "downloads: insert"
  on public.downloads for insert
  with check (auth.uid() = user_id);

-- NO UPDATE policy.
-- NO DELETE policy.
-- Immutability enforced at two levels — see REVOKE block below.


-- =====================================================================
-- RLS POLICIES — FAVOURITES
-- Read:   own rows
-- Insert: own (authenticated)
-- Delete: own
-- Update: none (toggled via insert/delete, not update)
-- =====================================================================
create policy "favourites: select"
  on public.favourites for select
  using (auth.uid() = user_id);

create policy "favourites: insert"
  on public.favourites for insert
  with check (auth.uid() = user_id);

create policy "favourites: delete"
  on public.favourites for delete
  using (auth.uid() = user_id);


-- =====================================================================
-- RLS POLICIES — NOTIFICATIONS
-- Read:   own rows
-- Update: own (mark as read)
-- Delete: own
-- Insert: NO policy — service_role / server inserts only.
-- =====================================================================
create policy "notifications: select"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: update"
  on public.notifications for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications: delete"
  on public.notifications for delete
  using (auth.uid() = user_id);


-- =====================================================================
-- RLS POLICIES — NOTIFICATION PREFERENCES
-- Read:   own row
-- Insert: own (also created by signup flow in step 1.3)
-- Update: own
-- Delete: none
-- =====================================================================
create policy "notification_preferences: select"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "notification_preferences: insert"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "notification_preferences: update"
  on public.notification_preferences for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =====================================================================
-- RLS POLICIES — CATEGORY FOLLOWS
-- Read:   own rows
-- Insert: own
-- Delete: own
-- Update: none (toggled via insert/delete)
-- =====================================================================
create policy "category_follows: select"
  on public.category_follows for select
  using (auth.uid() = user_id);

create policy "category_follows: insert"
  on public.category_follows for insert
  with check (auth.uid() = user_id);

create policy "category_follows: delete"
  on public.category_follows for delete
  using (auth.uid() = user_id);


-- =====================================================================
-- MONETARY TABLE PROTECTION — BELT AND SUSPENDERS
-- Revoke direct write access from all client-reachable roles on the
-- three monetary/audit tables. service_role retains all privileges
-- (required for the webhook handler). No RLS policies permit these
-- writes either, but the grant revocations add a second enforcement
-- layer that survives a mis-added policy.
--
-- subscriptions: write-restricted to service_role (Paystack webhook).
--   INSERT, UPDATE, DELETE all revoked — no client should ever touch this.
revoke insert, update, delete on public.subscriptions   from authenticated, anon;
--
-- subscription_events: append-only immutable audit log.
--   INSERT comes via service_role (bypasses grants). UPDATE + DELETE revoked.
revoke update, delete on public.subscription_events     from authenticated, anon;
--
-- downloads: append-only. INSERT intentionally NOT revoked — the download
--   flow requires authenticated users to insert their own records (the app
--   checks entitlement before that insert). UPDATE + DELETE revoked.
revoke update, delete on public.downloads               from authenticated, anon;


-- =====================================================================
-- STORAGE BUCKETS
-- resource-files:    PRIVATE — files are never served directly.
--                    Signed URLs with 60s TTL issued server-side
--                    after entitlement + download log.
-- resource-previews: PUBLIC — preview images served via CDN.
-- avatars:           PUBLIC — user profile avatars.
-- creator-avatars:   PUBLIC — creator profile avatars.
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('resource-files',    'resource-files',    false),
  ('resource-previews', 'resource-previews', true),
  ('avatars',           'avatars',           true),
  ('creator-avatars',   'creator-avatars',   true);


-- =====================================================================
-- STORAGE POLICIES (on storage.objects)
-- =====================================================================

-- resource-files: PRIVATE
-- No SELECT policy = no direct access for anon or authenticated.
-- service_role (admin.ts) generates signed URLs, bypassing RLS.
-- No INSERT/UPDATE/DELETE policies either — admin uploads via service_role.

-- resource-previews: PUBLIC read
create policy "resource-previews: public select"
  on storage.objects for select
  to public
  using (bucket_id = 'resource-previews');

-- avatars: PUBLIC read; authenticated users manage their own avatar.
-- File naming convention: {profile_id}.{ext} at bucket root.
create policy "avatars: public select"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars: authenticated insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name like (auth.uid()::text || '.%')
  );

create policy "avatars: authenticated update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name like (auth.uid()::text || '.%')
  );

create policy "avatars: authenticated delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and name like (auth.uid()::text || '.%')
  );

-- creator-avatars: PUBLIC read; admin manages via service_role.
create policy "creator-avatars: public select"
  on storage.objects for select
  to public
  using (bucket_id = 'creator-avatars');
