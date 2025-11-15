-- Create prompts table to store generated prompts
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  problem TEXT NOT NULL,
  precision TEXT NOT NULL,
  model_target TEXT NOT NULL,
  constraints TEXT,
  success_criteria TEXT,
  voice_style TEXT,
  tech_env TEXT,
  depth TEXT,
  format TEXT NOT NULL,
  generated_prompt TEXT NOT NULL,
  abstract_template JSONB,
  quality_scores JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_goal_type ON public.prompts(goal_type);
CREATE INDEX IF NOT EXISTS idx_prompts_precision ON public.prompts(precision);