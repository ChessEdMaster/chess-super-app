-- Create table for Concept Cards (derived from Tags)
CREATE TABLE IF NOT EXISTS academy_concepts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- The tag name (e.g., 'fork', 'pin')
    puzzle_count BIGINT DEFAULT 0,
    description TEXT, -- Can be populated manually or via AI later
    display_name TEXT, -- Ideally a cleaner name (e.g., 'Fork' instead of 'fork')
    icon TEXT, -- Icon name or URL
    color TEXT, -- UI Color
    category TEXT, -- 'Tactical', 'Strategic', 'Checking', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for academy_concepts
ALTER TABLE academy_concepts ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Public read access for concepts"
ON academy_concepts FOR SELECT
USING (true);

-- Allow write access only to service role/admins (assuming RBAC or just service role for script)
-- For now, we rely on Service Role for the script, but let's add an admin policy if needed
-- CREATE POLICY "Admins can manage concepts" ON academy_concepts ...

-- Indexes
CREATE INDEX IF NOT EXISTS idx_academy_concepts_name ON academy_concepts(name);
CREATE INDEX IF NOT EXISTS idx_academy_concepts_count ON academy_concepts(puzzle_count DESC);


-- Function to extract unique tags and counts from academy_exercises
-- This avoids fetching 5M rows to Node.js
CREATE OR REPLACE FUNCTION get_unique_tags_with_count()
RETURNS TABLE(tag_name text, puzzle_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tag AS tag_name,
        COUNT(*)::bigint AS puzzle_count
    FROM
        academy_exercises,
        unnest(tags) AS t(tag)
    GROUP BY
        t.tag
    ORDER BY
        puzzle_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
