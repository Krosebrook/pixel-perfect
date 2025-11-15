-- Add sharing and A/B testing capabilities to model_test_runs
ALTER TABLE public.model_test_runs
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN share_token text UNIQUE,
ADD COLUMN test_type text DEFAULT 'single' CHECK (test_type IN ('single', 'ab_test')),
ADD COLUMN variation_name text,
ADD COLUMN parent_test_id uuid REFERENCES public.model_test_runs(id);

-- Create index for share tokens
CREATE INDEX idx_model_test_runs_share_token ON public.model_test_runs(share_token) WHERE share_token IS NOT NULL;

-- Create user_budgets table for cost tracking
CREATE TABLE public.user_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_budget numeric DEFAULT 100.00,
  current_spending numeric DEFAULT 0.00,
  alert_threshold numeric DEFAULT 0.80,
  period_start timestamp with time zone DEFAULT date_trunc('month', now()),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS on user_budgets
ALTER TABLE public.user_budgets ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_budgets
CREATE POLICY "Users can view their own budget"
  ON public.user_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget"
  ON public.user_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget"
  ON public.user_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create AI insights table
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type text NOT NULL CHECK (insight_type IN ('cost_optimization', 'speed_optimization', 'quality_improvement', 'prompt_suggestion')),
  content text NOT NULL,
  based_on_runs uuid[] DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ai_insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_insights
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.ai_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policy for public sharing
CREATE POLICY "Public test runs are viewable by anyone with share token"
  ON public.model_test_runs FOR SELECT
  USING (is_public = true);

-- Function to update budget spending
CREATE OR REPLACE FUNCTION public.update_budget_spending()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current spending for the user's current period
  INSERT INTO public.user_budgets (user_id, current_spending, period_start)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.total_cost, 0),
    date_trunc('month', now())
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    current_spending = public.user_budgets.current_spending + COALESCE(NEW.total_cost, 0),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update budget on new test runs
CREATE TRIGGER update_budget_on_test_run
  AFTER INSERT ON public.model_test_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spending();

-- Add trigger for updated_at on user_budgets
CREATE TRIGGER update_user_budgets_updated_at
  BEFORE UPDATE ON public.user_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();