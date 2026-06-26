-- =====================================================================
-- Migration: 20260625000002_bethmor_pricing.sql
-- Replace legacy Solo/Team plans with 4-tier Bethmor Cruise pricing.
--
-- Changes:
--   plans.interval check constraint dropped (new plans use duration labels).
--   plans.description and plans.duration columns added.
--   Legacy plans deactivated (active = false); rows preserved for FK integrity.
--   Four Cruise-tier plans inserted.
-- =====================================================================

-- Ensure the plans table exists in case 20260624000000 did not fully commit.
CREATE TABLE IF NOT EXISTS public.plans (
  id       text    primary key,
  kobo     integer not null check (kobo > 0),
  interval text    not null,
  seats    integer not null default 1,
  label    text    not null,
  active   boolean not null default true
);

-- The auto-generated constraint name in PostgreSQL is plans_interval_check.
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_interval_check;

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS duration    text;

-- Deactivate legacy plans (preserve rows — payment_references FKs them).
UPDATE public.plans
SET active = false
WHERE id IN ('solo_monthly', 'solo_annual', 'team_monthly', 'team_annual');

-- Insert Bethmor Cruise-tier plans.
INSERT INTO public.plans (id, kobo, interval, seats, label, description, duration, active) VALUES
  ('cruise',         500000,  '1_month',  1, 'Cruise',         'Get unlimited assets for 1 month',  '1 month',  true),
  ('cruise_plus',    1000000, '3_months', 1, 'Cruise Plus',    'Get unlimited assets for 3 months', '3 months', true),
  ('cruise_pro',     2000000, '6_months', 1, 'Cruise Pro',     'Get unlimited assets for 6 months', '6 months', true),
  ('cruise_pro_max', 4000000, '1_year',   1, 'Cruise Pro Max', 'Get unlimited assets for 1 year',   '1 year',   true)
ON CONFLICT (id) DO NOTHING;
