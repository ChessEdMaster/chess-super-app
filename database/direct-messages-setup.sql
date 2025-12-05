-- Taula per converses (chats 1-a-1)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (participant_1_id < participant_2_id)
);

-- Index únic per evitar duplicats
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_participants 
ON public.conversations(participant_1_id, participant_2_id);

-- Index per consultes ràpides
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2_id);

-- Taula per missatges del xat
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index per consultes ràpides
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);

-- RLS Policies per conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() = participant_1_id OR auth.uid() = participant_2_id
    );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1_id OR auth.uid() = participant_2_id
    );

-- RLS Policies per direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.direct_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.direct_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.direct_messages;
CREATE POLICY "Users can send messages in their conversations" ON public.direct_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update messages read status" ON public.direct_messages;
CREATE POLICY "Users can update messages read status" ON public.direct_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
        )
    );

-- Trigger per actualitzar last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON public.direct_messages;
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
