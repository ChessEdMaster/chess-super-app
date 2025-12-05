'use client';

import React from 'react';
import { Conversation } from '@/hooks/useDirectMessages';
import { OnlineIndicator } from '@/components/presence/online-indicator';
import { MessageSquare } from 'lucide-react';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
    conversations,
    activeConversation,
    onSelectConversation
}: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-center">No conversations yet</p>
                <p className="text-sm text-center mt-2">
                    Click on a friend to start chatting
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {conversations.map((conversation) => (
                <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-900 transition ${activeConversation?.id === conversation.id ? 'bg-zinc-900' : ''
                        }`}
                >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold overflow-hidden">
                            {conversation.other_participant?.avatar_url ? (
                                <img
                                    src={conversation.other_participant.avatar_url}
                                    alt={conversation.other_participant.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                conversation.other_participant?.username?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0">
                            <OnlineIndicator
                                userId={conversation.other_participant?.id || ''}
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-bold truncate">
                                {conversation.other_participant?.username || 'Unknown'}
                            </p>
                            {conversation.last_message && (
                                <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                                    {new Date(conversation.last_message.created_at).toLocaleDateString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-400 truncate">
                                {conversation.last_message?.content || 'No messages yet'}
                            </p>
                            {(conversation.unread_count || 0) > 0 && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                                    {conversation.unread_count}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
