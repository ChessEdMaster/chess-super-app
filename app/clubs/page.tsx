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
                // No llenzar error, pero loguejar
            }

            // Esperar una mica per assegurar que la DB s'ha actualitzat
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirigir al club creat
            router.push(`/clubs/manage/${data.id}`);
        } catch (error: any) {
            console.error('Error creating club:', error);
            alert(error.message || 'Error al crear el club');
        } finally {
            setCreating(false);
            setShowCreateModal(false);
            setNewClubName('');
            setNewClubDescription('');
            setNewClubIsPublic(true);
            setNewClubType('online');
        }
    };

    // ...

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* ... header and search ... */}

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
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Tipus de Club
                                    </label>
                                    <select
                                        value={newClubType}
                                        onChange={(e) => setNewClubType(e.target.value as ClubType)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="online">Clan Online (App)</option>
                                        <option value="club">Club d'Escacs Real</option>
                                        <option value="school">Escola / Educatiu</option>
                                    </select>
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
                                        setNewClubType('online');
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

