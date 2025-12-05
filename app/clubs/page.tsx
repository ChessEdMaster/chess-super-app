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
import { toast } from 'sonner';

import { ClubType } from '@/types/feed';

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
    const [newClubType, setNewClubType] = useState<ClubType>('online');

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
                    is_public: newClubIsPublic,
                    type: newClubType
                })
                .select()
                .single();

            if (error) throw error;

            // Afegir el creador com a membre amb rol owner
            const { error: memberError } = await supabase
                .from('club_members')
                .insert({
                    club_id: data.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) {
                console.error('Error creating membership:', memberError);
            }

            // Esperar una mica per assegurar que la DB s'ha actualitzat
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirigir al club creat (manage page initially)
            router.push(`/clubs/manage/${data.id}`);
            toast.success('Club created successfully!');
        } catch (error: any) {
            console.error('Error creating club:', error);
            toast.error(error.message || 'Error al crear el club');
        } finally {
            setCreating(false);
            setShowCreateModal(false);
            setNewClubName('');
            setNewClubDescription('');
            setNewClubIsPublic(true);
            setNewClubType('online');
        }
    };

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
                        <p className="text-slate-400">Join a clan, compete in wars, and rise to the top!</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-yellow-900/20 flex items-center gap-2"
                    >
                        <Plus size={20} /> Create Clan
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search clans..."
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
                        <h3 className="text-xl font-bold text-slate-400 mb-2">No clans found</h3>
                        <p className="text-slate-500">Try adjusting your search or create a new one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clubs.map((club) => (
                            <Link key={club.id} href={`/clubs/${club.id}`} className="block h-full relative z-10">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-yellow-500/50 transition group h-full flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
                                            {club.image_url ? (
                                                <img src={club.image_url} alt={club.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Shield size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors line-clamp-1">{club.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} /> {club.member_count}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    {club.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                                    {club.is_public ? 'Public' : 'Private'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-grow">
                                        {club.short_description || club.description || 'No description provided.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto">
                                        <span className="text-xs text-slate-500">
                                            Owner: <span className="text-slate-300">{club.owner?.username || 'Unknown'}</span>
                                        </span>
                                        {club.is_member && (
                                            <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded-full">
                                                Member
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* CREATE CLUB MODAL */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Clan</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Clan Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newClubName}
                                        onChange={(e) => setNewClubName(e.target.value)}
                                        placeholder="Ex: Grandmasters United"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newClubDescription}
                                        onChange={(e) => setNewClubDescription(e.target.value)}
                                        placeholder="Describe your clan..."
                                        rows={4}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Clan Type
                                    </label>
                                    <select
                                        value={newClubType}
                                        onChange={(e) => setNewClubType(e.target.value as ClubType)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                                    >
                                        <option value="online">Online Clan</option>
                                        <option value="club">Real Chess Club</option>
                                        <option value="school">School / Education</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={newClubIsPublic}
                                        onChange={(e) => setNewClubIsPublic(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-yellow-600 focus:ring-yellow-500"
                                    />
                                    <label htmlFor="isPublic" className="text-sm text-slate-300">
                                        Public Clan (Anyone can join)
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
                                        setNewClubType('online');
                                    }}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createClub}
                                    disabled={!newClubName.trim() || creating}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={16} />
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create Clan'
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
