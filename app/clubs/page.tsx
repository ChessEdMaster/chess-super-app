'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    Loader2,
    Shield,
    Globe,
    Lock,
    Trophy
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { CreateClubModal } from '@/components/clubs/create-club-modal';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';

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

    const fetchClubs = useCallback(async (queryStr: string) => {
        try {
            setLoading(true);
            // Carregar clubs
            let query = supabase
                .from('clubs')
                .select('*')
                .order('member_count', { ascending: false })
                .order('created_at', { ascending: false });

            if (queryStr) {
                query = query.ilike('name', `%${queryStr}%`);
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
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchClubs('');
        }
    }, [user, fetchClubs]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) fetchClubs(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, user, fetchClubs]);

    if (authLoading || (!user && loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        )
    }

    return (
        <div className="h-full w-full p-4 md:p-6 pb-24 max-w-[1600px] mx-auto flex flex-col gap-6">

            {/* HEADER */}
            <Panel className="flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-900/90 border-zinc-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg border border-white/20">
                        <Shield className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-500 uppercase tracking-tight font-display drop-shadow-sm text-stroke">
                            Chess Clans
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                            Uneix-te a un clan, competeix i guanya glòria!
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6 md:mt-0 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar clans..."
                            className="w-full md:w-64 bg-zinc-950/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition font-medium text-sm shadow-inner"
                        />
                    </div>

                    <ShinyButton
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 whitespace-nowrap"
                    >
                        <Plus size={20} className="mr-2" /> Crear Clan
                    </ShinyButton>
                </div>
            </Panel>

            {/* CLUBS GRID */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-amber-500" size={48} />
                </div>
            ) : clubs.length === 0 ? (
                <GameCard variant="default" className="text-center py-20 bg-zinc-900/50 border-dashed border-zinc-700/50">
                    <Shield className="mx-auto text-zinc-700 mb-6 opacity-50" size={64} />
                    <h2 className="text-2xl font-black text-zinc-400 mb-2 font-display uppercase tracking-wide">Cap clan trobat</h2>
                    <p className="text-zinc-500 font-bold max-w-md mx-auto mb-8 text-sm">
                        Prova d&apos;ajustar la cerca o crea el teu propi clan per començar una nova dinastia!
                    </p>
                    <ShinyButton variant="secondary" onClick={() => setShowCreateModal(true)}>
                        Crear el Primer Clan
                    </ShinyButton>
                </GameCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {clubs.map((club) => (
                        <Link key={club.id} href={`/clubs/${club.id}`} className="block h-full group cursor-pointer">
                            <GameCard
                                variant={club.is_member ? "gold" : "default"}
                                className="h-full flex flex-col p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300"
                            >
                                {/* Banner / Header Area */}
                                <div className="h-28 bg-zinc-950 relative border-b border-zinc-800 group-hover:border-inherit transition-colors">
                                    {club.banner_url ? (
                                        <Image src={club.banner_url} alt={club.name} fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                    )}

                                    {/* Privacy Badge */}
                                    <div className="absolute top-3 right-3">
                                        {club.is_public ? (
                                            <div className="bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-[10px] font-black px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
                                                <Globe size={10} /> Públic
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/20 backdrop-blur-md text-red-400 text-[10px] font-black px-2 py-1 rounded border border-red-500/30 flex items-center gap-1 uppercase tracking-wider">
                                                <Lock size={10} /> Privat
                                            </div>
                                        )}
                                    </div>

                                    {/* Member Badge (if applicable) */}
                                    {club.is_member && (
                                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded border border-amber-400 shadow-lg uppercase tracking-wider animate-pulse-subtle">
                                            {club.role === 'admin' || club.role === 'owner' ? 'Líder' : 'Membre'}
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-5 flex flex-col flex-1 relative mt-[-32px]">
                                    {/* Club Avatar */}
                                    <div className={`
                                        w-16 h-16 rounded-2xl bg-zinc-900 border-4 flex items-center justify-center shrink-0 overflow-hidden shadow-xl mb-3 relative z-10
                                        ${club.is_member ? 'border-amber-500' : 'border-zinc-700 group-hover:border-zinc-500'}
                                    `}>
                                        {club.image_url ? (
                                            <Image src={club.image_url} alt={club.name} fill className="object-cover" />
                                        ) : (
                                            <Shield className={club.is_member ? "text-amber-500" : "text-zinc-600"} size={32} />
                                        )}
                                    </div>

                                    <h3 className="text-xl font-black text-white mb-1 font-display uppercase tracking-wide leading-none group-hover:text-amber-400 transition-colors truncate">
                                        {club.name}
                                    </h3>

                                    <div className="flex items-center gap-3 text-xs text-zinc-500 font-bold mb-3 uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                            <Users size={12} className="text-indigo-400" /> {club.member_count}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <span className="truncate max-w-[120px]">
                                            {club.owner?.username || 'Unknown'}
                                        </span>
                                    </div>

                                    <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed font-medium mb-4 flex-1">
                                        {club.short_description || club.description || 'Sense descripció.'}
                                    </p>

                                    <div className="mt-auto">
                                        <ShinyButton
                                            variant={club.is_member ? "neutral" : "secondary"}
                                            className="w-full h-9 text-xs uppercase tracking-widest"
                                        >
                                            {club.is_member ? 'Entrar al Clan' : 'Veure detalls'}
                                        </ShinyButton>
                                    </div>
                                </div>
                            </GameCard>
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
    );
}
