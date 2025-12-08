-- Create workouts table to store workout logs with calorie-based points
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gym_id UUID REFERENCES public.gyms(id),
  workout_type TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own workouts
CREATE POLICY "Users can view their own workouts" 
ON public.workouts 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own workouts
CREATE POLICY "Users can insert their own workouts" 
ON public.workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update their own workouts" 
ON public.workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete their own workouts" 
ON public.workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add points column to profiles for tracking total points
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;