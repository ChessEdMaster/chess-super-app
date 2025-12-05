'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { ConversationList } from '@/components/messages/conversation-list';
import { ChatWindow } from '@/components/messages/chat-window';
import { Loader2, MessageSquare } from 'lucide-react';

function MessagesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const userId = searchParams.get('userId');

    const {
        conversations,
        activeConversation,
        messages,
        loading,
        setActiveConversation,
        loadMessages,
        getOrCreateConversation,
        sendMessage
    } = useDirectMessages();

    // Redirigir si no està autenticat
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Si hi ha userId a la URL, obrir conversa amb aquest usuari
    useEffect(() => {
        if (userId && user) {
            handleStartConversation(userId);
        }
    }, [userId, user]);

    const handleStartConversation = async (otherUserId: string) => {
        const conversationId = await getOrCreateConversation(otherUserId);
        if (conversationId) {
            const conv = conversations.find(c => c.id === conversationId);
            if (conv) {
                setActiveConversation(conv);
                await loadMessages(conversationId);
            }
        }
    };

    const handleSelectConversation = async (conversation: any) => {
        setActiveConversation(conversation);
        await loadMessages(conversation.id);
    };

    const handleSendMessage = async (content: string) => {
        if (activeConversation) {
            await sendMessage(activeConversation.id, content);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/50">
                <MessageSquare size={24} className="text-purple-500" />
                <h1 className="text-2xl font-bold text-white">Messages</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Conversations Sidebar */}
                <div className="w-full md:w-80 border-r border-zinc-800 bg-zinc-900/30">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-purple-500" size={32} />
                        </div>
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            activeConversation={activeConversation}
                            onSelectConversation={handleSelectConversation}
                        />
                    )}
                </div>

                {/* Chat Window */}
                <div className="flex-1 hidden md:block">
                    <ChatWindow
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        otherUser={activeConversation?.other_participant}
                    />
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        }>
            <MessagesPageContent />
        </Suspense>
    );
}
