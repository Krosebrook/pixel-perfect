-- Create prompt_categories table
CREATE TABLE public.prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on prompt_categories
ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;

-- Prompt categories RLS policies
CREATE POLICY "Categories are viewable by everyone"
  ON public.prompt_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.prompt_categories
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Extend prompts table
ALTER TABLE public.prompts
  ADD COLUMN category_id UUID REFERENCES public.prompt_categories(id),
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN description TEXT,
  ADD COLUMN is_featured BOOLEAN DEFAULT false,
  ADD COLUMN fork_of UUID REFERENCES public.prompts(id),
  ADD COLUMN fork_count INT DEFAULT 0,
  ADD COLUMN use_count INT DEFAULT 0;

-- Create prompt_versions table
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL,
  generated_prompt TEXT NOT NULL,
  spec JSONB NOT NULL,
  quality_scores JSONB,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version_number)
);

-- Enable RLS on prompt_versions
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Prompt versions RLS policies
CREATE POLICY "Users can view versions of prompts they can view"
  ON public.prompt_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = prompt_id
      AND (
        p.visibility = 'public'
        OR p.created_by = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Users can create versions of their own prompts"
  ON public.prompt_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = prompt_id
      AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Create prompt_usage table
CREATE TABLE public.prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on prompt_usage
ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;

-- Prompt usage RLS policies
CREATE POLICY "Users can insert their own usage"
  ON public.prompt_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage"
  ON public.prompt_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
  ON public.prompt_usage
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to increment use count
CREATE OR REPLACE FUNCTION public.increment_prompt_use_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prompts
  SET use_count = use_count + 1
  WHERE id = NEW.prompt_id;
  RETURN NEW;
END;
$$;

-- Create trigger for use count
CREATE TRIGGER on_prompt_used
  AFTER INSERT ON public.prompt_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_prompt_use_count();

-- Create function to increment fork count
CREATE OR REPLACE FUNCTION public.increment_fork_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.fork_of IS NOT NULL THEN
    UPDATE public.prompts
    SET fork_count = fork_count + 1
    WHERE id = NEW.fork_of;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for fork count
CREATE TRIGGER on_prompt_forked
  AFTER INSERT ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_fork_count();

-- Insert default categories
INSERT INTO public.prompt_categories (name, slug, description, icon) VALUES
  ('Writing', 'writing', 'Content creation, copywriting, and creative writing prompts', '✍️'),
  ('Coding', 'coding', 'Software development, debugging, and code review prompts', '💻'),
  ('Analysis', 'analysis', 'Data analysis, research, and critical thinking prompts', '📊'),
  ('Agent', 'agent', 'AI agent workflows, automation, and multi-step reasoning', '🤖'),
  ('Creative', 'creative', 'Art direction, design, and creative ideation prompts', '🎨'),
  ('Research', 'research', 'Academic research, literature review, and fact-finding', '🔬'),
  ('Data', 'data', 'Data processing, transformation, and ETL workflows', '📁'),
  ('Image', 'image', 'Image generation, editing, and visual content prompts', '🖼️');

-- Create indexes for performance
CREATE INDEX idx_prompts_category ON public.prompts(category_id);
CREATE INDEX idx_prompts_tags ON public.prompts USING GIN(tags);
CREATE INDEX idx_prompts_created_by ON public.prompts(created_by);
CREATE INDEX idx_prompts_visibility ON public.prompts(visibility);
CREATE INDEX idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX idx_prompt_usage_user_id ON public.prompt_usage(user_id);
CREATE INDEX idx_prompt_usage_prompt_id ON public.prompt_usage(prompt_id);