'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Trophy, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/profile/user-profile';
import { useSocial } from '@/hooks/useSocial';
import { Feed } from '@/components/social/feed';
import { OnlineIndicator } from '@/components/presence/online-indicator';

import { toast } from 'sonner';

function SocialPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'feed' | 'friends' | 'clans' | 'events' | 'profile' | null;
    const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'clans' | 'events' | 'profile'>('feed');

    // Social Hook
    const {
        friends,
        pendingRequests,
        searchResults,
        loading,
        searchUsers,
        sendFriendRequest,
        acceptRequest,
        rejectRequest
    } = useSocial();

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (initialTab && ['feed', 'friends', 'clans', 'events', 'profile'].includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchUsers(searchQuery);
    };

    return (
        <div className="h-full w-full bg-zinc-950 flex flex-col">
            {/* Header Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-x-auto shrink-0">
                <button
                    onClick={() => setActiveTab('feed')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px]",
                        activeTab === 'feed' ? "text-white border-b-2 border-pink-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Feed
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px]",
                        activeTab === 'friends' ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Friends
                    {pendingRequests.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingRequests.length}</span>
                    )}
                </button>
                {/* ... other tabs ... */}
                <Link
                    href="/clubs"
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] text-center flex items-center justify-center",
                        activeTab === 'clans' ? "text-white border-b-2 border-yellow-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Clans
                </Link>
                <Link
                    href="/events"
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px] text-center flex items-center justify-center",
                        activeTab === 'events' ? "text-white border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Events
                </Link>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors min-w-[80px]",
                        activeTab === 'profile' ? "text-white border-b-2 border-indigo-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Profile
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-zinc-950 relative p-4">
                {activeTab === 'feed' && (
                    <Feed />
                )}

                {activeTab === 'friends' && (
                    // ... existing friends content
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Search Section */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">Find Friends</h3>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search username..."
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        user.username[0].toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-white font-medium">{user.username}</span>
                                            </div>
                                            <button
                                                onClick={() => sendFriendRequest(user.id)}
                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md transition-colors"
                                            >
                                                Add Friend
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    Pending Requests <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingRequests.length}</span>
                                </h3>
                                <div className="space-y-2">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold">
                                                    {req.sender?.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{req.sender?.username}</p>
                                                    <p className="text-xs text-zinc-500">wants to be your friend</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => acceptRequest(req.id)}
                                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => rejectRequest(req.id)}
                                                    className="bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friends List */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">My Friends ({friends.length})</h3>
                            {friends.length === 0 ? (
                                <div className="text-center py-8 text-zinc-600">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">You haven't added any friends yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {friends.map(friendship => (
                                        <div key={friendship.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-bold relative">
                                                    {friendship.friend?.username[0].toUpperCase()}
                                                    <div className="absolute bottom-0 right-0">
                                                        <OnlineIndicator userId={friendship.friend_id} size="sm" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{friendship.friend?.username}</p>
                                                    <OnlineIndicator userId={friendship.friend_id} showLabel size="sm" />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/messages?userId=${friendship.friend_id}`)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'clans' && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <MessageSquare size={32} className="opacity-20" />
                        <p className="text-xs">Join a Clan to compete!</p>
                        <Link href="/clubs">
                            <button className="mt-2 px-4 py-1.5 bg-yellow-600 text-white rounded-full font-bold text-xs">
                                Find Clan
                            </button>
                        </Link>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-3 max-w-2xl mx-auto">
                        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-3">
                            <div className="flex justify-between items-start mb-1">
                                <span className="bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
                                <span className="text-zinc-400 text-[10px]">Ends in 2h</span>
                            </div>
                            <h3 className="text-lg font-black text-white italic">Weekly Blitz Arena</h3>
                            <p className="text-zinc-400 text-xs mb-3">Compete for the Golden King avatar!</p>
                            <Link href="/events">
                                <button className="w-full py-2 bg-white text-black font-black uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-colors text-xs">
                                    Join Now
                                </button>
                            </Link>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <UserProfile />
                )}
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
