-- Free trial support
-- is_trial: marks trial subscriptions (no Paystack involvement)
-- trial_used on profiles: prevents a user from starting a second trial
alter table public.subscriptions
  add column if not exists is_trial boolean not null default false;

alter table public.profiles
  add column if not exists trial_used boolean not null default false;
