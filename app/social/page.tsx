'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/profile/user-profile';
import { useSocial } from '@/hooks/useSocial';
import { Feed } from '@/components/social/feed';
import { FriendsView } from '@/components/social/friends-view';
import { ClansView } from '@/components/social/clans-view';
import { EventsView } from '@/components/social/events-view';

function SocialPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'feed' | 'friends' | 'clans' | 'events' | 'profile' | null;
    const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'clans' | 'events' | 'profile'>('feed');

    // Social Hook for badge counts
    const { pendingRequests } = useSocial();

    useEffect(() => {
        if (initialTab && ['feed', 'friends', 'clans', 'events', 'profile'].includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleTabChange = (tab: 'feed' | 'friends' | 'clans' | 'events' | 'profile') => {
        setActiveTab(tab);
        // Optional: Update URL without full reload
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url.toString());
    };

    return (
        <div className="h-full w-full bg-zinc-950 flex flex-col">
            {/* Header Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-x-auto shrink-0 no-scrollbar">
                <button
                    onClick={() => handleTabChange('feed')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] whitespace-nowrap",
                        activeTab === 'feed' ? "text-white border-b-2 border-pink-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Feed
                </button>
                <button
                    onClick={() => handleTabChange('friends')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] whitespace-nowrap flex items-center justify-center gap-2",
                        activeTab === 'friends' ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Friends
                    {pendingRequests.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">{pendingRequests.length}</span>
                    )}
                </button>
                <button
                    onClick={() => handleTabChange('clans')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] whitespace-nowrap",
                        activeTab === 'clans' ? "text-white border-b-2 border-yellow-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Clans
                </button>
                <button
                    onClick={() => handleTabChange('events')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] whitespace-nowrap",
                        activeTab === 'events' ? "text-white border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Events
                </button>
                <button
                    onClick={() => handleTabChange('profile')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] whitespace-nowrap",
                        activeTab === 'profile' ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Profile
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-zinc-950 relative p-4">
                {activeTab === 'feed' && <Feed />}
                {activeTab === 'friends' && <FriendsView />}
                {activeTab === 'clans' && <ClansView />}
                {activeTab === 'events' && <EventsView />}
                {activeTab === 'profile' && <UserProfile />}
            </div>
        </div>
    );
}

export default function SocialPage() {
    return (
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-zinc-950 text-white">Loading...</div>}>
            <SocialPageContent />
        </Suspense>
    );
}
