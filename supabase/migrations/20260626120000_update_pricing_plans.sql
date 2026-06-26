-- =============================================================
-- Migration: update plans table to new 4-tier pricing
--
-- Deactivates legacy Cruise plans and inserts the new plans.
-- All prices in integer kobo (₦1 = 100 kobo).
-- ₦10k / ₦27k / ₦50k / ₦100k
-- =============================================================

-- Deactivate the old Cruise plan tier names
update public.plans
set active = false
where id in ('cruise', 'cruise_plus', 'cruise_pro', 'cruise_pro_max',
             'solo_monthly', 'solo_annual', 'team_monthly', 'team_annual');

-- Insert new 4-tier plans (idempotent — conflict on id)
insert into public.plans (id, kobo, interval, seats, label, active)
values
  ('monthly',   1000000,  'monthly', 1, 'Monthly',  true),
  ('quarterly', 2700000,  'monthly', 1, '3 Months', true),
  ('biannual',  5000000,  'monthly', 1, '6 Months', true),
  ('annual',    10000000, 'annual',  1, 'Annual',   true)
on conflict (id) do update
  set kobo   = excluded.kobo,
      label  = excluded.label,
      active = excluded.active;
