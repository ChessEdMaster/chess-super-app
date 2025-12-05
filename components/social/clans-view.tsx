'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Shield, Users, Trophy, ArrowRight, Loader2 } from 'lucide-react';

interface ClubPreview {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    member_count: number;
    description: string | null;
}

export function ClansView() {
    const { user } = useAuth();
    const [myClan, setMyClan] = useState<ClubPreview | null>(null);
    const [topClans, setTopClans] = useState<ClubPreview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchClansData();
        }
    }, [user]);

    const fetchClansData = async () => {
        try {
            setLoading(true);

            // Check if user is in a clan
            const { data: membership } = await supabase
                .from('club_members')
                .select('club_id, clubs(id, name, slug, image_url, member_count, description)')
                .eq('user_id', user?.id)
                .single();

            if (membership && membership.clubs) {
                // @ts-ignore
                setMyClan(membership.clubs);
            }

            // Fetch top clans
            const { data: top } = await supabase
                .from('clubs')
                .select('id, name, slug, image_url, member_count, description')
                .order('member_count', { ascending: false })
                .limit(3);

            if (top) {
                setTopClans(top);
            }

        } catch (error) {
            console.error('Error fetching clans data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* My Clan Section */}
            {myClan ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Shield size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">My Clan</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                                {myClan.image_url ? (
                                    <img src={myClan.image_url} alt={myClan.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <Shield size={32} />
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">{myClan.name}</h2>
                                <p className="text-zinc-400 text-sm flex items-center gap-2">
                                    <Users size={14} /> {myClan.member_count} Members
                                </p>
                            </div>
                        </div>
                        <Link href={`/clubs/${myClan.id}`}>
                            <button className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors w-full sm:w-auto">
                                Go to Clan HQ
                            </button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 rounded-xl p-6 text-center">
                    <Shield size={48} className="mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">You are not in a clan yet!</h2>
                    <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                        Join a clan to compete in weekly wars, earn exclusive rewards, and make new friends.
                    </p>
                    <Link href="/clubs">
                        <button className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold transition-colors">
                            Find a Clan
                        </button>
                    </Link>
                </div>
            )}

            {/* Top Clans */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Top Clans</h3>
                    <Link href="/clubs" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        View All <ArrowRight size={12} />
                    </Link>
                </div>
                <div className="space-y-3">
                    {topClans.map((clan, index) => (
                        <Link key={clan.id} href={`/clubs/${clan.id}`}>
                            <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
                                <div className="font-black text-zinc-600 text-xl w-6 text-center">#{index + 1}</div>
                                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 shrink-0">
                                    {clan.image_url ? (
                                        <img src={clan.image_url} alt={clan.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Shield size={20} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold truncate group-hover:text-yellow-500 transition-colors">{clan.name}</h4>
                                    <p className="text-zinc-500 text-xs truncate">{clan.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-400 text-xs whitespace-nowrap">
                                    <Users size={14} />
                                    <span>{clan.member_count}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
