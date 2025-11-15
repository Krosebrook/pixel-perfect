-- ============================================
-- PHASE 1: PROMPT TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.prompt_categories(id) ON DELETE SET NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  example_output TEXT,
  use_count INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}'::text[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on prompt_templates
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates
CREATE POLICY "Templates are viewable by everyone"
  ON public.prompt_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own templates"
  ON public.prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON public.prompt_templates FOR UPDATE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own templates"
  ON public.prompt_templates FOR DELETE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

-- Trigger for updating updated_at
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PHASE 2: PERFORMANCE LEADERBOARD
-- ============================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_test_runs_created_at ON public.model_test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_test_runs_models ON public.model_test_runs USING GIN(models);

-- Function to get model leaderboard
CREATE OR REPLACE FUNCTION public.get_model_leaderboard(
  time_range_days INTEGER DEFAULT 30,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  model_name TEXT,
  avg_latency_ms NUMERIC,
  avg_cost NUMERIC,
  total_usage BIGINT,
  success_rate NUMERIC,
  cost_efficiency_score NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH model_stats AS (
    SELECT 
      unnest(mtr.models) as model,
      mtr.total_latency_ms,
      mtr.total_cost,
      mtr.responses,
      mtr.created_at
    FROM public.model_test_runs mtr
    WHERE mtr.created_at >= now() - (time_range_days || ' days')::interval
  ),
  aggregated_stats AS (
    SELECT
      ms.model,
      AVG(ms.total_latency_ms)::numeric as avg_latency,
      AVG(ms.total_cost)::numeric as avg_cost,
      COUNT(*) as usage_count,
      COUNT(*) FILTER (WHERE ms.responses IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as success_rate
    FROM model_stats ms
    GROUP BY ms.model
  )
  SELECT
    a.model as model_name,
    ROUND(a.avg_latency, 2) as avg_latency_ms,
    ROUND(a.avg_cost, 4) as avg_cost,
    a.usage_count as total_usage,
    ROUND(a.success_rate, 2) as success_rate,
    ROUND((a.success_rate / NULLIF(a.avg_cost, 0)), 2) as cost_efficiency_score
  FROM aggregated_stats a
  ORDER BY cost_efficiency_score DESC NULLS LAST;
END;
$$;

-- ============================================
-- PHASE 3: SCHEDULED TESTING
-- ============================================

CREATE TABLE IF NOT EXISTS public.scheduled_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt_text TEXT,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  models TEXT[] NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  schedule_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_enabled BOOLEAN DEFAULT false,
  notification_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_test_id UUID NOT NULL REFERENCES public.scheduled_tests(id) ON DELETE CASCADE,
  test_run_id UUID REFERENCES public.model_test_runs(id) ON DELETE SET NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_tests
CREATE POLICY "Users can view their own scheduled tests"
  ON public.scheduled_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled tests"
  ON public.scheduled_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled tests"
  ON public.scheduled_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled tests"
  ON public.scheduled_tests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_test_results
CREATE POLICY "Users can view results of their scheduled tests"
  ON public.scheduled_test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_tests st
      WHERE st.id = scheduled_test_results.scheduled_test_id
      AND st.user_id = auth.uid()
    )
  );

-- Trigger for scheduled_tests
CREATE TRIGGER update_scheduled_tests_updated_at
  BEFORE UPDATE ON public.scheduled_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for scheduled tests
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_next_run ON public.scheduled_tests(next_run_at) WHERE is_active = true;

-- ============================================
-- PHASE 4: TEAM COLLABORATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('prompt', 'test_run', 'template', 'favorite')),
  resource_id UUID NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'edit')),
  UNIQUE(team_id, resource_type, resource_id)
);

-- Add team_id to existing tables
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.favorite_prompts ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.model_test_runs ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.prompt_templates ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_shared_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view teams they belong to"
  ON public.teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners and admins can update teams"
  ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners can delete teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for team_members
CREATE POLICY "Users can view members of their teams"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for team_shared_resources
CREATE POLICY "Users can view shared resources of their teams"
  ON public.team_shared_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_shared_resources.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can share resources"
  ON public.team_shared_resources FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_shared_resources.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unshare their own resources"
  ON public.team_shared_resources FOR DELETE
  USING (auth.uid() = shared_by);

-- Update existing RLS policies to include team access
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON public.prompts;
CREATE POLICY "Public prompts are viewable by everyone"
  ON public.prompts FOR SELECT
  USING (
    visibility = 'public' 
    OR auth.uid() = created_by 
    OR has_role(auth.uid(), 'admin')
    OR (
      team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = prompts.team_id AND tm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view their own favorite prompts" ON public.favorite_prompts;
CREATE POLICY "Users can view their own favorite prompts"
  ON public.favorite_prompts FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = favorite_prompts.team_id AND tm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can view their own test runs" ON public.model_test_runs;
CREATE POLICY "Users can view their own test runs"
  ON public.model_test_runs FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = model_test_runs.team_id AND tm.user_id = auth.uid()
      )
    )
  );

-- Triggers
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_shared_resources_team_id ON public.team_shared_resources(team_id);
CREATE INDEX IF NOT EXISTS idx_prompts_team_id ON public.prompts(team_id);
CREATE INDEX IF NOT EXISTS idx_favorite_prompts_team_id ON public.favorite_prompts(team_id);
CREATE INDEX IF NOT EXISTS idx_model_test_runs_team_id ON public.model_test_runs(team_id);