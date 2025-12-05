'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Shield, Users, Trophy, Calendar, ArrowRight, Loader2, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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

            console.log('Fetching club with ID:', clubId);

            // Fetch Club Details
            const { data: clubData, error: clubError } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', clubId)
                .single();

            if (clubError) {
                console.error('Supabase error fetching club:', clubError);
                throw clubError;
            }
            console.log('Club data fetched:', clubData);
            setClub(clubData);

            // Fetch Members (limit to 10 for preview)
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
            // @ts-ignore
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
        } catch (error: any) {
            console.error('Error joining club:', error);
            toast.error(error.message || 'Failed to join club');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <Shield size={64} className="text-slate-700 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Club Not Found</h1>
                <Link href="/clubs" className="text-indigo-400 hover:underline">Return to Clubs</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
            {/* Banner */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-slate-900 to-slate-800 relative overflow-hidden">
                {club.banner_url && (
                    <img src={club.banner_url} alt="Banner" className="w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-900 rounded-2xl border-4 border-slate-950 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                        {club.image_url ? (
                            <img src={club.image_url} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                            <Shield size={64} className="text-slate-700" />
                        )}
                    </div>

                    <div className="flex-1 pt-2 md:pt-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{club.name}</h1>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1">
                                        {club.is_public ? <Globe size={14} /> : <Lock size={14} />}
                                        {club.is_public ? 'Public Club' : 'Private Club'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} /> {club.member_count} Members
                                    </span>
                                    {club.owner && (
                                        <span className="flex items-center gap-1">
                                            <span className="text-slate-500">Owner:</span>
                                            <span className="text-white font-medium">{club.owner.username}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {userRole === 'owner' && (club.type === 'club' || club.type === 'school') ? (
                                    <Link href={`/clubs/manage/${club.id}`}>
                                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2">
                                            <Shield size={18} />
                                            Club ERP
                                        </button>
                                    </Link>
                                ) : userRole === 'owner' ? (
                                    <button className="bg-slate-800 text-slate-400 px-6 py-2.5 rounded-xl font-bold cursor-not-allowed border border-slate-700 flex items-center gap-2" title="ERP only available for Clubs and Schools">
                                        <Shield size={18} />
                                        Manage
                                    </button>
                                ) : userRole ? (
                                    <button className="bg-slate-800 text-slate-400 px-6 py-2.5 rounded-xl font-bold cursor-default border border-slate-700">
                                        Member
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleJoinClub}
                                        disabled={joining}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-bold transition shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                                    >
                                        {joining ? 'Joining...' : 'Join Club'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">About</h2>
                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {club.description || "No description provided."}
                            </p>
                        </div>

                        {/* Events Preview */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Calendar className="text-purple-500" /> Upcoming Events
                                </h2>
                                <Link href="/events" className="text-sm text-indigo-400 hover:text-indigo-300">View All</Link>
                            </div>
                            <div className="text-center py-8 text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No upcoming events scheduled.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Club Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Level</span>
                                    <span className="text-white font-bold">1</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Tournaments Won</span>
                                    <span className="text-white font-bold flex items-center gap-1">
                                        <Trophy size={14} className="text-yellow-500" /> 0
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Created</span>
                                    <span className="text-white">{new Date(club.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Members Preview */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Members</h3>
                                <span className="text-xs text-slate-500">{club.member_count} total</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {members.map((member) => (
                                    <div key={member.user_id} className="aspect-square bg-slate-800 rounded-lg overflow-hidden relative group" title={member.profile.username}>
                                        {member.profile.avatar_url ? (
                                            <img src={member.profile.avatar_url} alt={member.profile.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {member.profile.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        {member.role === 'owner' && (
                                            <div className="absolute bottom-0 right-0 bg-yellow-500 text-black p-0.5 rounded-tl-md">
                                                <Shield size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
