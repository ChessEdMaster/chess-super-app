-- Allow hosts to view their own challenges regardless of status (e.g. accepted)
CREATE POLICY "Users can view their own challenges" 
ON public.challenges FOR SELECT 
USING (auth.uid() = host_id);
