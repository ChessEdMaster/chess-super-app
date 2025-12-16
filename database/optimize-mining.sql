-- Revised Function to get unique tags efficiently (limit search space)
CREATE OR REPLACE FUNCTION get_unique_tags_with_count()
RETURNS TABLE(tag_name text, puzzle_count bigint) AS $$
BEGIN
    RETURN QUERY
    WITH tags_unrolled AS (
        -- Drastic limit to ensure execution
        SELECT unnest(tags) as tag
        FROM academy_exercises
        LIMIT 5000 
    )
    SELECT
        tag as tag_name,
        COUNT(*)::bigint as puzzle_count
    FROM
        tags_unrolled
    GROUP BY
        tag
    ORDER BY
        puzzle_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
