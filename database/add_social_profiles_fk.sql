
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_social_posts_profiles' 
        AND table_name = 'social_posts'
    ) THEN
        ALTER TABLE public.social_posts 
        ADD CONSTRAINT fk_social_posts_profiles 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;
