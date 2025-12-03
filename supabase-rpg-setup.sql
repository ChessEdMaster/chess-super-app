-- Add RPG columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{"AGGRESSION": 0, "SOLIDITY": 0, "KNOWLEDGE": 0, "SPEED": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS cards JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS chests JSONB DEFAULT '[]'::jsonb;

-- Create a function to initialize new users with default RPG stats if needed
-- (Trigger is likely already handling profile creation, we just added defaults)
