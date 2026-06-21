-- =====================================================================
-- Migration: 20260621000001_notification_preferences_trigger.sql
-- Step 1.3: Auto-create notification_preferences row on user signup
--
-- This is a SEPARATE migration from 1.2b (which must not be edited).
-- Creates a second trigger on auth.users that fires alongside
-- on_auth_user_created (profiles) in the same transaction.
-- Both rows are created atomically at signup time.
-- =====================================================================

create or replace function public.handle_new_user_prefs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_prefs
  after insert on auth.users
  for each row execute procedure public.handle_new_user_prefs();
