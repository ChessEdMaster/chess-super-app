'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage } from '@/hooks/useDirectMessages';
import { useAuth } from '@/components/auth-provider';
import { Send, Loader2 } from 'lucide-react';

interface ChatWindowProps {
    messages: DirectMessage[];
    onSendMessage: (content: string) => void;
    otherUser?: {
        username: string;
        avatar_url?: string;
    };
}

export function ChatWindow({ messages, onSendMessage, otherUser }: ChatWindowProps) {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        await onSendMessage(newMessage);
        setNewMessage('');
        setSending(false);
    };

    if (!otherUser) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500">
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold overflow-hidden">
                    {otherUser.avatar_url ? (
                        <img
                            src={otherUser.avatar_url}
                            alt={otherUser.username}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        otherUser.username[0]?.toUpperCase()
                    )}
                </div>
                <div>
                    <p className="text-white font-bold">{otherUser.username}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        <p>No messages yet. Say hi! 👋</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-zinc-800 text-white'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-zinc-500'
                                            }`}
                                    >
                                        {new Date(message.created_at).toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
