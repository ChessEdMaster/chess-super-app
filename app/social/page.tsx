'use client';

import React, { useState } from 'react';
import { Users, Trophy, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SocialPage() {
    const [activeTab, setActiveTab] = useState<'friends' | 'clans' | 'events'>('friends');

    return (
        <div className="h-full w-full bg-zinc-950 flex flex-col">
            {/* Header Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'friends' ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Friends
                </button>
                <button
                    onClick={() => setActiveTab('clans')}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'clans' ? "text-white border-b-2 border-yellow-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Clans
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={cn(
                        "flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'events' ? "text-white border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Events
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto pb-32">
                {activeTab === 'friends' && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <Users size={48} className="opacity-20" />
                        <p>No friends online</p>
                        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-sm">
                            Invite Friends
                        </button>
                    </div>
                )}

                {activeTab === 'clans' && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <MessageSquare size={48} className="opacity-20" />
                        <p>Join a Clan to compete!</p>
                        <button className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-full font-bold text-sm">
                            Find Clan
                        </button>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</span>
                                <span className="text-zinc-400 text-xs">Ends in 2h</span>
                            </div>
                            <h3 className="text-xl font-black text-white italic">Weekly Blitz Arena</h3>
                            <p className="text-zinc-400 text-sm mb-4">Compete for the Golden King avatar!</p>
                            <button className="w-full py-2 bg-white text-black font-black uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-colors">
                                Join Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
