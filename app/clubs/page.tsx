'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    Calendar,
    MessageSquare,
    Heart,
    Crown,
    Shield,
    UserPlus,
    Loader2,
    ArrowRight,
    Globe,
    Lock
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';

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
    const [creating, setCreating] = useState(false);
    const [newClubName, setNewClubName] = useState('');
    const [newClubDescription, setNewClubDescription] = useState('');
    const [newClubIsPublic, setNewClubIsPublic] = useState(true);

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
            // Carregar clubs
            const { data: clubsData, error: clubsError } = await supabase
                .from('clubs')
                .select('*')
                .eq('is_active', true)
                .order('member_count', { ascending: false })
                .order('created_at', { ascending: false });

            if (clubsError) throw clubsError;

            // Carregar informació de membres per l'usuari actual
            if (clubsData && user) {
                const clubIds = clubsData.map(c => c.id);
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

    const createClub = async () => {
        if (!user || !newClubName.trim()) return;

        setCreating(true);
        try {
            const slug = newClubName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            const { data, error } = await supabase
                .from('clubs')
                .insert({
                    name: newClubName.trim(),
                    slug: slug,
                    description: newClubDescription.trim() || null,
                    short_description: newClubDescription.trim().substring(0, 150) || null,
                    owner_id: user.id,
                    is_public: newClubIsPublic
                })
                .select()
                .single();

            if (error) throw error;

            // Afegir el creador com a membre amb rol owner
            await supabase
                .from('club_members')
                .insert({
                    club_id: data.id,
                    user_id: user.id,
                    role: 'owner'
                });

            // Redirigir al club creat
            router.push(`/clubs/${data.slug}`);
        } catch (error: any) {
            console.error('Error creating club:', error);
            alert(error.message || 'Error al crear el club');
        } finally {
            setCreating(false);
            setShowCreateModal(false);
            setNewClubName('');
            setNewClubDescription('');
            setNewClubIsPublic(true);
        }
    };

    const joinClub = async (clubId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('club_members')
                .insert({
                    club_id: clubId,
                    user_id: user.id,
                    role: 'member'
                });

            if (error) throw error;
            loadClubs();
        } catch (error: any) {
            console.error('Error joining club:', error);
            alert(error.message || 'Error al unir-se al club');
        }
    };

    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                            <Users size={40} className="text-purple-500" /> Clubs d'Escacs
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            Connecta amb altres jugadors, comparteix partides, organitza torneigs i forma part d'una comunitat activa.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-900/50 mt-4 md:mt-0"
                    >
                        <Plus size={20} /> Crear Club
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cercar clubs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 pl-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                        />
                    </div>
                </div>

                {/* CLUBS GRID */}
                {filteredClubs.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="mx-auto text-slate-700 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">
                            {searchQuery ? 'No s\'han trobat clubs' : 'Encara no hi ha clubs'}
                        </h3>
                        <p className="text-slate-500">
                            {searchQuery ? 'Prova amb altres paraules clau' : 'Sigues el primer a crear un club!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClubs.map((club) => (
                            <Link
                                key={club.id}
                                href={`/clubs/${club.slug}`}
                                className="block"
                            >
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition group cursor-pointer shadow-lg hover:shadow-purple-900/20 h-full flex flex-col">
                                    {/* BANNER/IMAGE */}
                                    {club.banner_url && (
                                        <div className="w-full h-32 rounded-lg mb-4 overflow-hidden">
                                            <img
                                                src={club.banner_url}
                                                alt={club.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* HEADER */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {club.image_url ? (
                                                <img
                                                    src={club.image_url}
                                                    alt={club.name}
                                                    className="w-12 h-12 rounded-full border-2 border-purple-500/50"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/50">
                                                    <Users className="text-purple-400" size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                                                    {club.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    {club.is_public ? (
                                                        <Globe size={12} />
                                                    ) : (
                                                        <Lock size={12} />
                                                    )}
                                                    <span>{club.is_public ? 'Públic' : 'Privat'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {club.is_member && (
                                            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-purple-900/30 text-purple-400 border border-purple-500/30">
                                                {club.role === 'owner' && <Crown size={12} />}
                                                {club.role === 'admin' && <Shield size={12} />}
                                                {club.role === 'moderator' && <Shield size={12} />}
                                                {club.role === 'member' && <UserPlus size={12} />}
                                                <span className="capitalize">{club.role}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* DESCRIPTION */}
                                    <p className="text-slate-400 mb-4 text-sm flex-grow">
                                        {club.short_description || club.description || 'Sense descripció'}
                                    </p>

                                    {/* STATS */}
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Users size={14} />
                                                <span className="font-bold">{club.member_count} membres</span>
                                            </div>
                                        </div>
                                        <div className="text-purple-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            {club.is_member ? 'Entrar' : 'Veure'}
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* CREATE CLUB MODAL */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold text-white mb-6">Crear Nou Club</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Nom del Club *
                                    </label>
                                    <input
                                        type="text"
                                        value={newClubName}
                                        onChange={(e) => setNewClubName(e.target.value)}
                                        placeholder="Ex: Club d'Escacs Barcelona"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Descripció
                                    </label>
                                    <textarea
                                        value={newClubDescription}
                                        onChange={(e) => setNewClubDescription(e.target.value)}
                                        placeholder="Descriu el teu club..."
                                        rows={4}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={newClubIsPublic}
                                        onChange={(e) => setNewClubIsPublic(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                                    />
                                    <label htmlFor="isPublic" className="text-sm text-slate-300">
                                        Club públic (qualsevol pot unir-se)
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewClubName('');
                                        setNewClubDescription('');
                                        setNewClubIsPublic(true);
                                    }}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Cancel·lar
                                </button>
                                <button
                                    onClick={createClub}
                                    disabled={!newClubName.trim() || creating}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={16} />
                                            Creant...
                                        </span>
                                    ) : (
                                        'Crear Club'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

