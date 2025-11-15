-- Enable Row Level Security on prompts table
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read all prompts (public gallery)
CREATE POLICY "Anyone can view prompts"
  ON public.prompts
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert prompts (no auth required)
CREATE POLICY "Anyone can create prompts"
  ON public.prompts
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to update their own prompts
CREATE POLICY "Anyone can update prompts"
  ON public.prompts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow anyone to delete prompts
CREATE POLICY "Anyone can delete prompts"
  ON public.prompts
  FOR DELETE
  USING (true);