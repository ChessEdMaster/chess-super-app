'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, MessageSquare } from 'lucide-react';

interface ChatBoxProps {
    gameId: string;
    userId: string;
    username: string;
}

export function ChatBox({ gameId, userId, username }: ChatBoxProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Carregar missatges antics
        const fetchMessages = async () => {
            try {
                // Primero obtener los mensajes
                const { data: messagesData, error: messagesError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('game_id', gameId)
                    .order('created_at', { ascending: true });

                if (messagesError) {
                    console.error('[ChatBox] Error fetching messages:', messagesError);
                    return;
                }

                if (!messagesData) return;

                // Luego obtener los perfiles para cada mensaje
                const messagesWithProfiles = await Promise.all(
                    messagesData.map(async (msg) => {
                        try {
                            const { data: profile, error: profileError } = await supabase
                                .from('profiles')
                                .select('username')
                                .eq('id', msg.user_id)
                                .single();
                            
                            if (profileError) {
                                console.warn('[ChatBox] Error fetching profile for user:', msg.user_id, profileError);
                            }
                            
                            return {
                                ...msg,
                                profiles: profile ? { username: profile.username } : null
                            };
                        } catch (error) {
                            console.error('[ChatBox] Error processing message:', error);
                            return {
                                ...msg,
                                profiles: null
                            };
                        }
                    })
                );

                setMessages(messagesWithProfiles);
            } catch (error) {
                console.error('[ChatBox] Error in fetchMessages:', error);
            }
        };

        fetchMessages();

        // Subscripció Realtime
        const channel = supabase
            .channel(`chat_${gameId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `game_id=eq.${gameId}` }, async (payload) => {
                const newMsg = payload.new;
                // Necessitem el username, que no ve al payload directe
                const { data: profile } = await supabase.from('profiles').select('username').eq('id', newMsg.user_id).single();
                setMessages((prev) => [...prev, { ...newMsg, profiles: profile }]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [gameId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        await supabase.from('messages').insert({
            game_id: gameId,
            user_id: userId,
            content: msg
        });
    };

    return (
        <div className="flex flex-col h-[300px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-slate-300 text-sm flex items-center gap-2">
                <MessageSquare size={16} /> Xat de la Partida
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.length === 0 && <p className="text-slate-600 text-xs text-center italic mt-10">Digues hola al teu rival! 👋</p>}
                {messages.map((msg) => {
                    const isMe = msg.user_id === userId;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 px-1">
                                {isMe ? 'Tu' : msg.profiles?.username || 'Rival'}
                            </span>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={sendMessage} className="p-2 bg-slate-800 border-t border-slate-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escriu un missatge..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition">
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
