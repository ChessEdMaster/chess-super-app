'use client';

import React, { useEffect, useState } from 'react';
import { useArenaStore, LeaderboardEntry } from '@/lib/store/arena-store';
import { ArenaVariant } from '@/types/arena';
import { Trophy, Medal, Star, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/components/ui/design-system/Panel';

interface LeaderboardProps {
    variant: ArenaVariant;
}

export function Leaderboard({ variant }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fetchLeaderboard = useArenaStore(state => state.fetchLeaderboard);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await fetchLeaderboard(variant);
            setEntries(data);
            setIsLoading(false);
        };
        load();
    }, [variant, fetchLeaderboard]);

    return (
        <Panel className="w-full bg-zinc-950/40 border-white/5 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                        <Trophy className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">
                            Leaderboard {variant.toUpperCase()}
                        </h2>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                            Top 20 Gladiadors d'aquest Variant
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
            ) : (
                <div className="space-y-2 overflow-hidden">
                    {entries.map((entry, idx) => (
                        <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`
                                flex items-center justify-between p-3 rounded-xl border transition-all duration-300
                                ${idx === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                                    idx === 1 ? 'bg-zinc-100/10 border-zinc-100/30' :
                                        idx === 2 ? 'bg-orange-400/10 border-orange-400/30' :
                                            'bg-white/5 border-transparent hover:border-white/10'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm
                                    ${idx === 0 ? 'bg-amber-500 text-black' :
                                        idx === 1 ? 'bg-zinc-300 text-black' :
                                            idx === 2 ? 'bg-orange-500 text-black' :
                                                'text-zinc-500'}
                                `}>
                                    {entry.rank || idx + 1}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800 flex items-center justify-center">
                                        {entry.avatar_url ? (
                                            <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-zinc-600" size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white hover:text-amber-400 cursor-pointer transition-colors">
                                            {entry.username}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                <Star size={10} className="text-amber-500" />
                                                {entry.current_cups} Copes
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-amber-500 font-mono">
                                    {entry.rating.toFixed(0)} <span className="text-[10px] text-zinc-500">ELO</span>
                                </div>
                                {idx < 3 && (
                                    <div className="flex justify-end mt-1">
                                        <Medal size={14} className={
                                            idx === 0 ? 'text-amber-500' :
                                                idx === 1 ? 'text-zinc-300' :
                                                    'text-orange-500'
                                        } />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {entries.length === 0 && (
                        <div className="py-12 text-center opacity-50 italic text-sm text-zinc-500">
                            Encara no hi ha dades per aquest leaderboard.
                        </div>
                    )}
                </div>
            )}
        </Panel>
    );
}
