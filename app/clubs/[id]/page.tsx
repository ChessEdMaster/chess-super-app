'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Shield, Users, Trophy, Calendar, ArrowRight, Loader2, Lock, Globe, Swords, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

interface ClubDetails {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    banner_url: string | null;
    member_count: number;
    is_public: boolean;
    owner_id: string;
    created_at: string;
    owner?: {
        username: string;
        avatar_url: string | null;
    };
    type: string;
}

interface ClubMember {
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    profile: {
        username: string;
        avatar_url: string | null;
    };
}

export default function ClubPublicPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [club, setClub] = useState<ClubDetails | null>(null);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
    const [joining, setJoining] = useState(false);

    const clubId = params.id as string;

    useEffect(() => {
        fetchClubData();
    }, [clubId]);

    const fetchClubData = async () => {
        try {
            setLoading(true);

            // Fetch Club Details
            const { data: clubData, error: clubError } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', clubId)
                .single();

            if (clubError) throw clubError;
            setClub(clubData);

            // Fetch Members (limit to 12 for preview)
            const { data: membersData, error: membersError } = await supabase
                .from('club_members')
                .select(`
                    user_id,
                    role,
                    joined_at,
                    profile:profiles(username, avatar_url)
                `)
                .eq('club_id', clubId)
                .limit(12);

            if (membersError) throw membersError;
            // @ts-expect-error - Supabase join types are complex
            setMembers(membersData || []);

            // Check User Role
            if (user) {
                const { data: membership } = await supabase
                    .from('club_members')
                    .select('role')
                    .eq('club_id', clubId)
                    .eq('user_id', user.id)
                    .single();

                if (membership) {
                    setUserRole(membership.role);
                }
            }

        } catch (error) {
            console.error('Error fetching club:', error);
            toast.error('Failed to load club details');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClub = async () => {
        if (!user || !club) return;

        setJoining(true);
        try {
            const { error } = await supabase
                .from('club_members')
                .insert({
                    club_id: club.id,
                    user_id: user.id,
                    role: 'member'
                });

            if (error) throw error;

            toast.success(`Welcome to ${club.name}!`);
            setUserRole('member');
            fetchClubData(); // Refresh data
        } catch (error) {
            console.error('Error joining club:', error);
            toast.error((error as Error).message || 'Failed to join club');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <GameCard variant="default" className="text-center p-12">
                    <Shield size={64} className="mx-auto text-zinc-600 mb-4" />
                    <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Club Not Found</h1>
                    <Link href="/clubs">
                        <ShinyButton variant="neutral">Return to Clubs</ShinyButton>
                    </Link>
                </GameCard>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-4 md:p-6 pb-24 max-w-[1600px] mx-auto flex flex-col gap-6">

            {/* Navigation */}
            <Link href="/clubs" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition font-bold uppercase tracking-wider text-xs w-fit">
                <ArrowLeft size={16} /> Tornar a Clans
            </Link>

            {/* HERO SECTION */}
            <div className="relative rounded-3xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-2xl">
                {/* Banner */}
                <div className="h-48 md:h-64 relative bg-zinc-950">
                    {club.banner_url ? (
                        <Image src={club.banner_url} alt="Banner" fill className="object-cover opacity-60" />
                    ) : (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative px-6 pb-6 -mt-16 md:-mt-20 flex flex-col md:flex-row items-end md:items-end gap-6 z-10">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center shrink-0 overflow-hidden relative group">
                        {club.image_url ? (
                            <Image src={club.image_url} alt={club.name} fill className="object-cover" />
                        ) : (
                            <Shield size={64} className="text-zinc-700" />
                        )}
                        {/* Level Badge Placeholder */}
                        <div className="absolute bottom-0 right-0 bg-amber-500 text-white text-xs font-black px-2 py-1 rounded-tl-xl border-t border-l border-amber-300 shadow-lg">
                            LVL 1
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-wide font-display text-stroke drop-shadow-lg">
                                    {club.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded border ${club.is_public ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
                                        {club.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                        {club.is_public ? 'Public' : 'Privat'}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                                        <Users size={12} className="text-indigo-400" /> {club.member_count} Membres
                                    </span>
                                    {club.owner && (
                                        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                                            <span className="text-zinc-500">Líder:</span>
                                            <span className="text-white">{club.owner.username}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2 md:mt-0">
                                {['owner', 'admin'].includes(userRole || '') ? (
                                    <Link href={`/clubs/manage/${club.id}`}>
                                        <ShinyButton variant="secondary" className="px-6 py-3">
                                            <Swords size={20} className="mr-2" />
                                            {club.type === 'online' ? 'Manage Clan' : 'Club ERP'}
                                        </ShinyButton>
                                    </Link>
                                ) : userRole ? (
                                    <ShinyButton variant="neutral" className="cursor-default opacity-100">
                                        Membre
                                    </ShinyButton>
                                ) : (
                                    <ShinyButton
                                        variant="primary"
                                        onClick={handleJoinClub}
                                        disabled={joining}
                                        className="px-8 py-3"
                                    >
                                        {joining ? 'Joining...' : 'Join Club'}
                                    </ShinyButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About */}
                    <GameCard variant="default" className="p-6 bg-zinc-900/80">
                        <h2 className="text-lg font-black text-white mb-4 uppercase tracking-wide font-display border-b border-zinc-800 pb-2">
                            Sobre el Clan
                        </h2>
                        <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap font-medium text-sm">
                            {club.description || "No description provided."}
                        </p>
                    </GameCard>

                    {/* Events Preview */}
                    <GameCard variant="default" className="p-6 bg-zinc-900/80">
                        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-2">
                            <h2 className="text-lg font-black text-white uppercase tracking-wide font-display flex items-center gap-2">
                                <Calendar className="text-purple-500" /> Esdeveniments
                            </h2>
                            <Link href="/events" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
                                Veure Tots
                            </Link>
                        </div>
                        <div className="text-center py-10 text-zinc-600 bg-zinc-950/30 rounded-xl border border-zinc-800/50 border-dashed">
                            <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="font-bold text-sm">Cap esdeveniment proper.</p>
                        </div>
                    </GameCard>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stats */}
                    <Panel className="p-6 bg-zinc-900 border-zinc-700">
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Trophy size={14} /> Estadístiques
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <span className="text-zinc-400 text-xs font-bold uppercase">Nivell</span>
                                <span className="text-white font-black font-display text-lg">1</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <span className="text-zinc-400 text-xs font-bold uppercase">Victòries</span>
                                <span className="text-amber-500 font-black font-display text-lg flex items-center gap-1">
                                    <Trophy size={16} /> 0
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <span className="text-zinc-400 text-xs font-bold uppercase">Fundat</span>
                                <span className="text-white font-mono text-sm">{new Date(club.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Panel>

                    {/* Members Preview */}
                    <Panel className="p-6 bg-zinc-900 border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} /> Membres
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                {club.member_count} TOTAL
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {members.map((member) => (
                                <div key={member.user_id} className="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative group border border-zinc-700 hover:border-amber-500 transition-colors" title={member.profile.username}>
                                    {member.profile.avatar_url ? (
                                        <Image src={member.profile.avatar_url} alt={member.profile.username} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xs bg-zinc-900">
                                            {member.profile.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    {member.role === 'owner' && (
                                        <div className="absolute top-0 right-0 bg-amber-500 text-white p-0.5 rounded-bl-md shadow-sm">
                                            <Shield size={8} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {club.member_count > 12 && (
                            <div className="mt-4 text-center">
                                <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
                                    Veure tots els membres
                                </button>
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    );
}
