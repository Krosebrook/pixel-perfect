-- Create table to track user devices/sessions
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can only see their own devices
CREATE POLICY "Users can view their own devices"
  ON public.user_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert their own devices"
  ON public.user_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update their own devices"
  ON public.user_devices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete their own devices"
  ON public.user_devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);