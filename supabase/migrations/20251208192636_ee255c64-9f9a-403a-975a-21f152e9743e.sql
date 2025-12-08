-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy allowing users to see profiles of members in the same gym
CREATE POLICY "Users can view profiles in same gym or own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  gym_id IN (
    SELECT gym_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Add policy to allow viewing all profiles for global leaderboard (only name field is typically shown)
CREATE POLICY "Authenticated users can view all profiles for leaderboard" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');