CREATE OR REPLACE FUNCTION bulk_update_exercise_tags(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
    v_lichess_id text;
    v_new_tags text[];
BEGIN
    -- Iterate through the JSON array
    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        v_lichess_id := item->>'lichess_id';
        -- Convert JSON array to text array
        v_new_tags := ARRAY(SELECT jsonb_array_elements_text(item->'tags'));

        -- Update the matching row by searching in the Title column
        -- Assumption: Title format is "Lichess Puzzle #ID"
        -- We construct the search string like 'Lichess Puzzle #ID'
        -- OR, if title is inconsistent, we might need a dedicated column for Lichess ID.
        -- Given current data: "Lichess Puzzle #Gwk7R"
        
        UPDATE academy_exercises
        SET tags = v_new_tags
        WHERE title = 'Lichess Puzzle #' || v_lichess_id;
        
    END LOOP;
END;
$$;
