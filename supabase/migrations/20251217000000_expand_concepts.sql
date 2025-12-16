
-- Add columns to academy_concepts for Encyclopedia support
ALTER TABLE academy_concepts 
ADD COLUMN IF NOT EXISTS eco text,
ADD COLUMN IF NOT EXISTS pgn text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS fen text;

-- Create index for faster opening lookups
CREATE INDEX IF NOT EXISTS idx_academy_concepts_eco ON academy_concepts(eco);
CREATE INDEX IF NOT EXISTS idx_academy_concepts_category ON academy_concepts(category);
