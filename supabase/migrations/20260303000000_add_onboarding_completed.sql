-- Add onboarding_completed field to profiles table.
-- Tracks whether a user has finished (or skipped) the first-run onboarding wizard.
-- NULL / FALSE  → onboarding not yet completed; show wizard on next login.
-- TRUE          → onboarding completed; do not auto-show wizard.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
