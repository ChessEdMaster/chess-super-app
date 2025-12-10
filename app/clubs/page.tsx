'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    Loader2,
    Shield,
    Globe,
    Lock
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { CreateClubModal } from '@/components/clubs/create-club-modal';

interface Club {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    image_url: string | null;
    banner_url: string | null;
    owner_id: string;
    is_public: boolean;
    member_count: number;
    created_at: string;
    owner?: {
        username?: string;
        avatar_url?: string;
    };
    is_member?: boolean;
    role?: string;
}

export default function ClubsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadClubs();
        }
    }, [user]);

    const loadClubs = async () => {
        try {
            setLoading(true);
            // Carregar clubs
            let query = supabase
                .from('clubs')
                .select('*')
                .order('member_count', { ascending: false })
                .order('created_at', { ascending: false });

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }

            const { data: clubsData, error: clubsError } = await query;

            if (clubsError) throw clubsError;

            // Carregar informació de membres per l'usuari actual
            if (clubsData && user) {
                const clubIds = clubsData.map(c => c.id);
                // If no clubs found, skip
                if (clubIds.length === 0) {
                    setClubs([]);
                    return;
                }

                const { data: memberships } = await supabase
                    .from('club_members')
                    .select('club_id, role')
                    .eq('user_id', user.id)
                    .in('club_id', clubIds);

                const membershipMap = new Map(
                    memberships?.map(m => [m.club_id, m.role]) || []
                );

                // Carregar informació dels propietaris
                const ownerIds = [...new Set(clubsData.map(c => c.owner_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', ownerIds);

                const profileMap = new Map(
                    profiles?.map(p => [p.id, p]) || []
                );

                const clubsWithInfo = clubsData.map(club => ({
                    ...club,
                    is_member: membershipMap.has(club.id),
                    role: membershipMap.get(club.id),
                    owner: profileMap.get(club.owner_id)
                }));

                setClubs(clubsWithInfo);
            } else {
                setClubs(clubsData || []);
            }
        } catch (error) {
            console.error('Error loading clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) loadClubs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-yellow-500" size={32} />
                            Chess Clans
                        </h1>
                        <p className="text-slate-400">Uneix-te a un clan, competeix i puja al rànquing!</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-yellow-900/20 flex items-center gap-2 transform active:scale-95"
                    >
                        <Plus size={20} /> Crear Clan
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar clans..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                </div>

                {/* Clubs Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-yellow-500" size={48} />
                    </div>
                ) : clubs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <Shield size={48} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Cap clan trobat</h3>
                        <p className="text-slate-500">Prova d'ajustar la cerca o crea'n un de nou!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clubs.map((club) => (
                            <Link key={club.id} href={`/clubs/${club.id}`} className="block h-full relative z-10 group">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-yellow-500/50 transition group h-full flex flex-col relative overflow-hidden">

                                    {/* Type Badge */}
                                    <div className="absolute top-4 right-4">
                                        {club.is_public ? (
                                            <div className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                                                <Globe size={10} /> Públic
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-500/20 flex items-center gap-1">
                                                <Lock size={10} /> Privat
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0 overflow-hidden border border-slate-700">
                                            {club.image_url ? (
                                                <img src={club.image_url} alt={club.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Shield size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-1">{club.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} /> {club.member_count} membres
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-grow">
                                        {club.short_description || club.description || 'Sense descripció.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
                                        <span className="text-xs text-slate-500">
                                            Owner: <span className="text-slate-300">{club.owner?.username || 'Unknown'}</span>
                                        </span>
                                        {club.is_member && (
                                            <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded-full">
                                                Membre
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <CreateClubModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    userId={user?.id || ''}
                />
            </div>
        </div>
    );
}
