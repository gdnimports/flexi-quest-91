-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'member');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own member role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'member');

-- Create gyms table
CREATE TABLE public.gyms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- RLS policies for gyms
CREATE POLICY "Anyone can view gyms"
ON public.gyms FOR SELECT
USING (true);

CREATE POLICY "Owners can insert their gym"
ON public.gyms FOR INSERT
WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update their gym"
ON public.gyms FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their gym"
ON public.gyms FOR DELETE
USING (auth.uid() = owner_id);

-- Trigger for updated_at
CREATE TRIGGER update_gyms_updated_at
BEFORE UPDATE ON public.gyms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles to reference gyms table
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_gym 
FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE SET NULL;

-- Create storage bucket for gym logos
INSERT INTO storage.buckets (id, name, public) VALUES ('gym-logos', 'gym-logos', true);

-- Storage policies
CREATE POLICY "Anyone can view gym logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'gym-logos');

CREATE POLICY "Gym owners can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gym-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Gym owners can update their logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gym-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Gym owners can delete their logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'gym-logos' AND auth.uid()::text = (storage.foldername(name))[1]);