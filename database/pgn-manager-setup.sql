-- PGN Collections (Folders/Databases)
CREATE TABLE IF NOT EXISTS pgn_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL, -- e.g. "My Best Games", "Lichess Study: Sicilian"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PGN Games
CREATE TABLE IF NOT EXISTS pgn_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES pgn_collections(id) ON DELETE CASCADE,
    white TEXT,
    black TEXT,
    result TEXT,
    date TEXT,
    event TEXT,
    site TEXT,
    pgn TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE pgn_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgn_games ENABLE ROW LEVEL SECURITY;

-- Policies for pgn_collections
CREATE POLICY "Users can view their own collections"
    ON pgn_collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
    ON pgn_collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON pgn_collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON pgn_collections FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for pgn_games
-- Access depends on the collection ownership.
-- A user can see games if they own the collection.
CREATE POLICY "Users can view games in their collections"
    ON pgn_games FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pgn_collections
            WHERE pgn_collections.id = pgn_games.collection_id
            AND pgn_collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert games into their collections"
    ON pgn_games FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pgn_collections
            WHERE pgn_collections.id = collection_id
            AND pgn_collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update games in their collections"
    ON pgn_games FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM pgn_collections
            WHERE pgn_collections.id = pgn_games.collection_id
            AND pgn_collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete games in their collections"
    ON pgn_games FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM pgn_collections
            WHERE pgn_collections.id = pgn_games.collection_id
            AND pgn_collections.user_id = auth.uid()
        )
    );
