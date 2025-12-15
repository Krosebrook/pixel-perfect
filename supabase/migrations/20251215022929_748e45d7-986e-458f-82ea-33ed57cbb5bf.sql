-- Create deployment changelogs table
CREATE TABLE public.deployment_changelogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_id UUID REFERENCES public.deployment_metrics(id) ON DELETE CASCADE,
  previous_deployment_id UUID REFERENCES public.deployment_metrics(id),
  commit_range TEXT NOT NULL,
  commits JSONB NOT NULL DEFAULT '[]',
  release_notes TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deployment_changelogs ENABLE ROW LEVEL SECURITY;

-- Anyone can view changelogs
CREATE POLICY "Anyone can view deployment changelogs"
  ON public.deployment_changelogs FOR SELECT
  USING (true);

-- Service role can insert changelogs
CREATE POLICY "Service role can insert changelogs"
  ON public.deployment_changelogs FOR INSERT
  WITH CHECK (true);

-- Enable realtime for changelogs
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_changelogs;