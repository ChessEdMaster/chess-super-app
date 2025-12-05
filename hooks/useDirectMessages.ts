'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

export interface Conversation {
    id: string;
    participant_1_id: string;
    participant_2_id: string;
    last_message_at: string;
    created_at: string;
    other_participant?: {
        id: string;
        username: string;
        avatar_url?: string;
    };
    unread_count?: number;
    last_message?: DirectMessage;
}

export interface DirectMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        username: string;
        avatar_url?: string;
    };
}

export function useDirectMessages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [loading, setLoading] = useState(false);

    // Carregar converses
    const loadConversations = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    direct_messages(content, created_at, sender_id, is_read)
                `)
                .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Enriquir amb info del altre participant
            const enrichedConversations = await Promise.all(
                (data || []).map(async (conv: any) => {
                    const otherId = conv.participant_1_id === user.id
                        ? conv.participant_2_id
                        : conv.participant_1_id;

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', otherId)
                        .single();

                    // Calcular missatges no llegits
                    const unreadCount = conv.direct_messages?.filter((msg: any) =>
                        msg.sender_id !== user.id && !msg.is_read
                    ).length || 0;

                    // Últim missatge
                    const lastMessage = conv.direct_messages?.[0];

                    return {
                        ...conv,
                        other_participant: profile ? { id: otherId, ...profile } : undefined,
                        unread_count: unreadCount,
                        last_message: lastMessage
                    };
                })
            );

            setConversations(enrichedConversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Carregar missatges d'una conversa
    const loadMessages = useCallback(async (conversationId: string) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select(`
                    *,
                    profiles!direct_messages_sender_id_fkey(username, avatar_url)
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);

            // Marcar com llegits els missatges de l'altre usuari
            await supabase
                .from('direct_messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, [user]);

    // Crear o obtenir conversa amb un usuari
    const getOrCreateConversation = useCallback(async (otherUserId: string) => {
        if (!user) return null;

        try {
            // Ordenar IDs per garantir consistència
            const [id1, id2] = [user.id, otherUserId].sort();

            // Buscar conversa existent
            const { data: existing, error: searchError } = await supabase
                .from('conversations')
                .select('*')
                .eq('participant_1_id', id1)
                .eq('participant_2_id', id2)
                .single();

            if (existing) {
                return existing.id;
            }

            // Crear nova conversa
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    participant_1_id: id1,
                    participant_2_id: id2
                })
                .select()
                .single();

            if (createError) throw createError;

            await loadConversations();
            return newConv.id;
        } catch (error) {
            console.error('Error getting/creating conversation:', error);
            toast.error('Failed to start conversation');
            return null;
        }
    }, [user, loadConversations]);

    // Enviar missatge
    const sendMessage = useCallback(async (conversationId: string, content: string) => {
        if (!user || !content.trim()) return;

        try {
            const { error } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: content.trim()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    }, [user]);

    // Subscripció Realtime als missatges
    useEffect(() => {
        if (!activeConversation || !user) return;

        const channel = supabase
            .channel(`messages:${activeConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${activeConversation.id}`
                },
                async (payload) => {
                    const newMessage = payload.new as DirectMessage;

                    // Obtenir info del sender
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    setMessages(prev => [...prev, { ...newMessage, sender: profile || undefined }]);

                    // Marcar com llegit si no sóc jo el sender
                    if (newMessage.sender_id !== user.id) {
                        await supabase
                            .from('direct_messages')
                            .update({ is_read: true })
                            .eq('id', newMessage.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeConversation, user]);

    // Carregar converses inicialment
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    return {
        conversations,
        activeConversation,
        messages,
        loading,
        setActiveConversation,
        loadMessages,
        getOrCreateConversation,
        sendMessage,
        loadConversations
    };
}
