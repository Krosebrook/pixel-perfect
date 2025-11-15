-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create trigger function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Give first user admin role, others get user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN (SELECT COUNT(*) FROM auth.users) = 1 THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migrate prompts table
ALTER TABLE public.prompts 
  ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN visibility TEXT CHECK (visibility IN ('private', 'public')) DEFAULT 'private';

-- Set existing prompts to public (migration compatibility)
UPDATE public.prompts SET visibility = 'public' WHERE visibility IS NULL;

-- Make created_by NOT NULL after setting defaults
ALTER TABLE public.prompts ALTER COLUMN created_by SET NOT NULL;

-- Drop old RLS policies on prompts
DROP POLICY IF EXISTS "Anyone can view prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can create prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can update prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can delete prompts" ON public.prompts;

-- Create new RLS policies for prompts
CREATE POLICY "Public prompts are viewable by everyone"
  ON public.prompts
  FOR SELECT
  USING (
    visibility = 'public' 
    OR auth.uid() = created_by
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create their own prompts"
  ON public.prompts
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own prompts"
  ON public.prompts
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own prompts"
  ON public.prompts
  FOR DELETE
  USING (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), 'admin')
  );

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();