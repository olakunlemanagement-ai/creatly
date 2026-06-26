-- Phase 5: Creator Earnings & Payouts
-- Tables: creator_bank_accounts, creator_earnings, creator_payouts
-- All money in integer kobo (₦1 = 100 kobo). Never float.

-- ============================================================
-- creator_bank_accounts
-- Stores verified Nigerian bank accounts for Paystack transfers.
-- ============================================================
create table public.creator_bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references auth.users on delete cascade,
  bank_code      text not null,          -- Paystack bank code (e.g. '058')
  account_number text not null,
  account_name   text not null,          -- verified by Paystack /bank/resolve
  bank_name      text not null,
  is_default     boolean not null default true,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (creator_id, account_number, bank_code)
);

-- ============================================================
-- creator_earnings
-- Monthly earnings snapshots, computed server-side. Append-only in practice.
-- Amounts are integer kobo.
-- ============================================================
create table public.creator_earnings (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references auth.users,
  period_month     text not null,          -- 'YYYY-MM'
  download_count   integer not null default 0,
  total_downloads  integer not null default 0,   -- platform total for that month
  revenue_pool_kobo integer not null default 0,  -- 70% of platform revenue
  earnings_kobo    integer not null default 0,   -- creator's proportional share
  status           text not null default 'pending'
                   check (status in ('pending', 'paid', 'carried_over')),
  created_at       timestamptz not null default now(),
  unique (creator_id, period_month)
);

-- ============================================================
-- creator_payouts
-- Paystack Transfer records. Written by the server only.
-- Append-only — no UPDATE/DELETE policies for non-admin.
-- ============================================================
create table public.creator_payouts (
  id                     uuid primary key default gen_random_uuid(),
  creator_id             uuid not null references auth.users,
  bank_account_id        uuid not null references public.creator_bank_accounts,
  amount_kobo            integer not null check (amount_kobo > 0),
  paystack_transfer_code text,            -- from Paystack Transfer API response
  paystack_recipient_code text,           -- Paystack transfer recipient code
  status                 text not null default 'pending'
                         check (status in ('pending', 'success', 'failed', 'reversed')),
  period_months          text[] not null, -- earning periods covered by this payout
  initiated_at           timestamptz not null default now(),
  settled_at             timestamptz,
  failure_reason         text
);

-- ============================================================
-- RLS
-- creator_bank_accounts: owner read/write own; admin all
-- creator_earnings: owner read own; admin all; no client insert/update
-- creator_payouts: owner read own; admin all; no client insert
-- ============================================================

alter table public.creator_bank_accounts enable row level security;
alter table public.creator_earnings      enable row level security;
alter table public.creator_payouts       enable row level security;

-- creator_bank_accounts: owner may read/insert/update their own rows
create policy "owner_read" on public.creator_bank_accounts
  for select using (auth.uid() = creator_id);

create policy "owner_insert" on public.creator_bank_accounts
  for insert with check (auth.uid() = creator_id);

create policy "owner_update" on public.creator_bank_accounts
  for update using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

create policy "admin_all" on public.creator_bank_accounts
  for all using (public.is_admin());

-- creator_earnings: creators may only READ their own rows; server writes via admin client
create policy "owner_read" on public.creator_earnings
  for select using (auth.uid() = creator_id);

create policy "admin_all" on public.creator_earnings
  for all using (public.is_admin());

-- creator_payouts: creators may only READ their own rows; server writes via admin client
create policy "owner_read" on public.creator_payouts
  for select using (auth.uid() = creator_id);

create policy "admin_all" on public.creator_payouts
  for all using (public.is_admin());

-- Enum constants stored here for reference (enforced by check constraints above):
-- creator_earnings.status: 'pending' | 'paid' | 'carried_over'
-- creator_payouts.status:  'pending' | 'success' | 'failed' | 'reversed'
