-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own member role" ON public.user_roles;

-- Create a new policy that allows users to insert their own role (member or owner)
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);