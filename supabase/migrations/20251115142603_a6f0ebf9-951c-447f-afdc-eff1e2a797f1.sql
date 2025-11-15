-- Create model_test_runs table
CREATE TABLE public.model_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id),
  prompt_text TEXT NOT NULL,
  models TEXT[] NOT NULL,
  responses JSONB NOT NULL,
  total_cost NUMERIC(10,6),
  total_latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on model_test_runs
ALTER TABLE public.model_test_runs ENABLE ROW LEVEL SECURITY;

-- Model test runs RLS policies
CREATE POLICY "Users can view their own test runs"
  ON public.model_test_runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test runs"
  ON public.model_test_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all test runs"
  ON public.model_test_runs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_model_test_runs_user_id ON public.model_test_runs(user_id);
CREATE INDEX idx_model_test_runs_created_at ON public.model_test_runs(created_at DESC);