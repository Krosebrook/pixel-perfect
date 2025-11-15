-- Create API keys table
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] DEFAULT '{}',
  environment_mode text NOT NULL DEFAULT 'sandbox',
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_environment CHECK (environment_mode IN ('sandbox', 'production'))
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for API keys
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(
  _key_hash text,
  _endpoint_name text
) RETURNS TABLE(
  user_id uuid,
  environment_mode text,
  is_valid boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.user_id,
    ak.environment_mode,
    (ak.is_active AND 
     (ak.expires_at IS NULL OR ak.expires_at > now()) AND
     _endpoint_name = ANY(ak.scopes)) as is_valid
  FROM public.api_keys ak
  WHERE ak.key_hash = _key_hash;
  
  -- Update last_used_at
  UPDATE public.api_keys
  SET last_used_at = now()
  WHERE key_hash = _key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;