-- Create favorite_prompts table
CREATE TABLE public.favorite_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,
  models TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on favorite_prompts
ALTER TABLE public.favorite_prompts ENABLE ROW LEVEL SECURITY;

-- Favorite prompts RLS policies
CREATE POLICY "Users can view their own favorite prompts"
  ON public.favorite_prompts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite prompts"
  ON public.favorite_prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite prompts"
  ON public.favorite_prompts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite prompts"
  ON public.favorite_prompts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_favorite_prompts_user_id ON public.favorite_prompts(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_favorite_prompts_updated_at
  BEFORE UPDATE ON public.favorite_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();