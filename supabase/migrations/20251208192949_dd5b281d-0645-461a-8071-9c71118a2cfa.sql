-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view profiles in same gym or own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles for leaderboard" ON public.profiles;

-- Create a security definer function to get user's gym_id (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_gym_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gym_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create proper policies using the security definer function
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles in same gym" 
ON public.profiles 
FOR SELECT 
USING (
  gym_id IS NOT NULL 
  AND gym_id = public.get_user_gym_id(auth.uid())
);