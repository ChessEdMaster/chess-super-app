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
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Users, Newspaper, Shield, Calendar, User } from 'lucide-react';

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

    interface TabItem {
        id: 'feed' | 'friends' | 'clans' | 'events' | 'profile';
        label: string;
        icon: any;
        color: 'neutral' | 'primary' | 'secondary' | 'success';
        badge?: number;
    }

    const tabs: TabItem[] = [
        { id: 'feed', label: 'Notícies', icon: Newspaper, color: 'neutral' },
        { id: 'friends', label: 'Amics', icon: Users, color: 'primary', badge: pendingRequests.length },
        { id: 'clans', label: 'Clans', icon: Shield, color: 'secondary' },
        { id: 'events', label: 'Events', icon: Calendar, color: 'success' },
        { id: 'profile', label: 'Perfil', icon: User, color: 'neutral' },
    ];

    return (
        <div className="h-full w-full flex flex-col bg-[var(--background)]">
            {/* Header Tabs */}
            <div className="p-4 bg-[var(--header-bg)] backdrop-blur-sm sticky top-0 z-20 border-b border-[var(--border)] shadow-lg">
                <Panel className="flex p-2 gap-2 overflow-x-auto no-scrollbar justify-start md:justify-center">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <ShinyButton
                                key={tab.id}
                                variant={isActive ? tab.color : 'neutral'}
                                className={cn(
                                    "flex-1 min-w-[100px] h-[40px] text-xs font-black tracking-wide transition-all",
                                    !isActive && "opacity-70 hover:opacity-100"
                                )}
                                onClick={() => handleTabChange(tab.id)}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    {tab.badge ? (
                                        <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                            {tab.badge}
                                        </span>
                                    ) : null}
                                </div>
                            </ShinyButton>
                        );
                    })}
                </Panel>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative p-4 custom-scrollbar">
                <div className="max-w-7xl mx-auto h-full">
                    {activeTab === 'feed' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Feed />
                        </div>
                    )}
                    {activeTab === 'friends' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <FriendsView />
                        </div>
                    )}
                    {activeTab === 'clans' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ClansView />
                        </div>
                    )}
                    {activeTab === 'events' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <EventsView />
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <UserProfile />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SocialPage() {
    return (
        <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
                    <p className="text-amber-500 font-bold tracking-wide text-xs animate-pulse">Carregant...</p>
                </div>
            </div>
        }>
            <SocialPageContent />
        </Suspense>
    );
}
