
-- Allow members to view partners for their gym
CREATE POLICY "Members can view partners for their gym"
ON public.partners
FOR SELECT
USING (gym_id = get_user_gym_id(auth.uid()));
