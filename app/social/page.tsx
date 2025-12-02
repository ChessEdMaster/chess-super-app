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
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'friends' ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Friends
                </button>
                <button
                    onClick={() => setActiveTab('clans')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'clans' ? "text-white border-b-2 border-yellow-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Clans
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={cn(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                        activeTab === 'events' ? "text-white border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    Events
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-3 overflow-y-auto pb-24">
                {activeTab === 'friends' && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <Users size={32} className="opacity-20" />
                        <p className="text-xs">No friends online</p>
                        <button className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-full font-bold text-xs">
                            Invite Friends
                        </button>
                    </div>
                )}

                {activeTab === 'clans' && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                        <MessageSquare size={32} className="opacity-20" />
                        <p className="text-xs">Join a Clan to compete!</p>
                        <button className="mt-2 px-4 py-1.5 bg-yellow-600 text-white rounded-full font-bold text-xs">
                            Find Clan
                        </button>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-3">
                        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-3">
                            <div className="flex justify-between items-start mb-1">
                                <span className="bg-purple-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
                                <span className="text-zinc-400 text-[10px]">Ends in 2h</span>
                            </div>
                            <h3 className="text-lg font-black text-white italic">Weekly Blitz Arena</h3>
                            <p className="text-zinc-400 text-xs mb-3">Compete for the Golden King avatar!</p>
                            <button className="w-full py-2 bg-white text-black font-black uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-colors text-xs">
                                Join Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
