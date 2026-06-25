-- Extended profile fields: gender, date_of_birth, phone_number, language
-- These are optional user-facing fields added for the dashboard profile/account UI.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender        text         CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS phone_number  text,
  ADD COLUMN IF NOT EXISTS language      text         NOT NULL DEFAULT 'en';

-- Users can update their own extended profile fields via the existing profiles
-- update RLS policy (own row only).
