
-- Add permissive SELECT policies for anonymous/public access to prompts and categories
CREATE POLICY "Anyone can view public prompts"
ON public.prompts
FOR SELECT
TO anon, authenticated
USING (visibility = 'public');

CREATE POLICY "Anyone can view categories"
ON public.prompt_categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Also allow anon to view profiles for display name lookups
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
