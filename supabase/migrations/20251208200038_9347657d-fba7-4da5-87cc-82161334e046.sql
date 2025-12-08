-- Create partners table for gym owners
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Owners can view their gym's partners
CREATE POLICY "Owners can view their gym partners"
ON public.partners
FOR SELECT
USING (
  gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
);

-- Owners can insert partners for their gym
CREATE POLICY "Owners can insert partners for their gym"
ON public.partners
FOR INSERT
WITH CHECK (
  gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
);

-- Owners can update their gym's partners
CREATE POLICY "Owners can update their gym partners"
ON public.partners
FOR UPDATE
USING (
  gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
);

-- Owners can delete their gym's partners
CREATE POLICY "Owners can delete their gym partners"
ON public.partners
FOR DELETE
USING (
  gym_id IN (SELECT id FROM public.gyms WHERE owner_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();