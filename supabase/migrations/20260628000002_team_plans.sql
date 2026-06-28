-- ============================================================
-- Team subscription plans
-- 5-seat plans at a per-seat discount vs individual plans.
-- All prices in integer kobo (₦1 = 100 kobo).
-- ₦35k / ₦90k / ₦300k for monthly / 3-month / annual.
-- ============================================================

insert into public.plans (id, kobo, interval, seats, label, active)
values
  ('team_monthly',   3500000,  'monthly', 5, 'Team Monthly',  true),
  ('team_quarterly', 9000000,  'monthly', 5, 'Team 3 Months', true),
  ('team_annual',    30000000, 'annual',  5, 'Team Annual',   true)
on conflict (id) do update
  set kobo   = excluded.kobo,
      label  = excluded.label,
      seats  = excluded.seats,
      active = excluded.active;
