-- Add email notification preferences to user_budgets table
ALTER TABLE public.user_budgets 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_email text;