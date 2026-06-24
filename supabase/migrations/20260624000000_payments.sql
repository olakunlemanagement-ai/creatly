-- =====================================================================
-- Migration: 20260624000000_payments.sql
-- Phase 2: Subscription plans, payment references, teams, invites
--
-- Tables added:
--   plans             — catalogue of subscription plans (seed data below)
--   payment_references — idempotency log; insert BEFORE Paystack redirect
--   teams             — team workspace entity for team plan subscribers
--   team_invites      — pending invitations (distinct from accepted team_members)
--
-- Columns added to subscriptions:
--   plan_id   text  — references plans(id); preferred over legacy plan_type
--   cancel_at timestamptz — soft-cancel: access continues until this date
--   team_id   uuid  — the team this subscription belongs to (team plans only)
--
-- Money guardrails:
--   plans.kobo and payment_references.kobo are INTEGER — never float/decimal.
--   ₦1 = 100 kobo. See CONVENTIONS §6.
-- =====================================================================


-- =====================================================================
-- PLANS reference table
-- Seeded below; never computed at runtime.
-- =====================================================================
create table if not exists public.plans (
  id       text    primary key,                             -- 'solo_monthly' etc.
  kobo     integer not null check (kobo > 0),              -- INTEGER kobo, never float
  interval text    not null check (interval in ('monthly', 'annual')),
  seats    integer not null default 1,
  label    text    not null,
  active   boolean not null default true
);

-- No RLS needed: plans are public read-only data.
-- Service role (webhook) is the only writer.

-- Seed plan rows — matches lib/pricing.ts PLANS constant exactly.
insert into public.plans (id, kobo, interval, seats, label) values
  ('solo_monthly',  150000,  'monthly', 1, 'Solo Monthly'),
  ('solo_annual',   1500000, 'annual',  1, 'Solo Annual'),
  ('team_monthly',  400000,  'monthly', 5, 'Team Monthly'),
  ('team_annual',   4000000, 'annual',  5, 'Team Annual')
on conflict (id) do nothing;


-- =====================================================================
-- PAYMENT REFERENCES
-- Idempotency log. Row is inserted server-side BEFORE the Paystack
-- redirect. The webhook updates status → 'success' or 'failed'.
-- No UPDATE policy for app users — only the service-role (webhook) updates.
-- =====================================================================
create table if not exists public.payment_references (
  reference  text        primary key,                       -- uuid v4 generated at checkout
  user_id    uuid        not null references auth.users,
  plan_id    text        not null references public.plans,
  kobo       integer     not null,                          -- INTEGER kobo; verified vs plan.kobo in webhook
  status     text        not null default 'pending'
             check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

alter table public.payment_references enable row level security;

-- Users may only read their own references.
create policy "payment_references: owner select"
  on public.payment_references for select
  using (auth.uid() = user_id);

-- No insert policy: server-side only (route handler uses server client with user session).
-- No update/delete policy: only the webhook (service_role) updates status.

create index if not exists idx_payment_refs_user_id
  on public.payment_references(user_id);
create index if not exists idx_payment_refs_status
  on public.payment_references(status);


-- =====================================================================
-- TEAMS
-- Created automatically when a team plan subscription is activated
-- (webhook handler calls ensureTeamForUser).
-- =====================================================================
create table if not exists public.teams (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  owner_id   uuid        not null references auth.users,
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

-- Team owner can read and update their team.
create policy "teams: owner all"
  on public.teams for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Accepted team members can read the team.
create policy "teams: member select"
  on public.teams for select
  using (
    exists (
      select 1
      from public.team_members tm
      join public.subscriptions s on s.id = tm.subscription_id
      where s.team_id = teams.id
        and tm.profile_id = auth.uid()
        and tm.invite_accepted = true
    )
  );

create index if not exists idx_teams_owner_id on public.teams(owner_id);


-- =====================================================================
-- TEAM INVITES
-- Pending invitations. Distinct from team_members (accepted only).
-- Token is auto-generated by the DB; accepted_at is set on accept.
-- =====================================================================
create table if not exists public.team_invites (
  id          uuid        primary key default gen_random_uuid(),
  team_id     uuid        not null references public.teams on delete cascade,
  email       text        not null,
  token       text        not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid        not null references auth.users,
  accepted_at timestamptz,
  expires_at  timestamptz not null default now() + interval '7 days',
  created_at  timestamptz not null default now()
);

alter table public.team_invites enable row level security;

-- Team owner can read all invites for their teams.
create policy "team_invites: owner select"
  on public.team_invites for select
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_invites.team_id and t.owner_id = auth.uid()
    )
  );

-- Open read (token is the effective auth — verified server-side before any write).
-- Invitee landing page reads the invite row by token via service role; no anon policy needed.

create index if not exists idx_team_invites_team_id on public.team_invites(team_id);
create index if not exists idx_team_invites_token   on public.team_invites(token);


-- =====================================================================
-- ALTER SUBSCRIPTIONS
-- Add Phase 2 columns. paystack_sub_code already exists (skipped safely).
-- cancel_at: soft-cancel date — entitlement still passes while status=active.
-- plan_id:   references plans(id); use alongside legacy plan_type.
-- team_id:   set when the subscription is part of a team workspace.
-- =====================================================================
alter table public.subscriptions
  add column if not exists plan_id    text references public.plans,
  add column if not exists cancel_at  timestamptz,
  add column if not exists team_id    uuid references public.teams;

create index if not exists idx_subscriptions_plan_id  on public.subscriptions(plan_id);
create index if not exists idx_subscriptions_team_id  on public.subscriptions(team_id);
