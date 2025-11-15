-- Fix scheduled_test_results INSERT policy for service role
CREATE POLICY "Service role can insert test results"
ON scheduled_test_results FOR INSERT
TO service_role
WITH CHECK (true);

-- Restrict profiles to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Restrict prompt categories to authenticated users
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON prompt_categories;

CREATE POLICY "Authenticated users can view categories"
ON prompt_categories FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);