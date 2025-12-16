-- 1. Add course_id to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES academy_courses(id);

-- 2. Archive existing courses
UPDATE academy_courses SET published = false WHERE published = true;

-- 3. Create new courses
-- We will insert them and return IDs to be used?? No, we can just insert them.
-- But wait, we need to know their IDs to seed modules.
-- Better to handle insertion in the script logic to capture IDs, OR use a stored procedure.
-- For this SQL file, I'll just define the structure changes. The seeding data is better done in script to loop 30 times easily.
