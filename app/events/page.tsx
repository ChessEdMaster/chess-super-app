'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Trophy, Users, MapPin, Clock, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Panel } from '@/components/ui/design-system/Panel';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_type: 'tournament' | 'lesson' | 'meetup' | 'other';
    start_date: string;
    end_date: string | null;
    location: string | null;
    max_participants: number | null;
    current_participants: number;
    organizer_id: string;
    club_id: string | null;
    is_public: boolean;
    created_at: string;
    organizer?: {
        username: string;
        avatar_url?: string;
    };
    club?: {
        name: string;
        slug: string;
    };
}

export default function EventsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadEvents();
        }
    }, [user, filter]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('club_events')
                .select(`
                    *,
                    club:clubs(name, slug)
                `)
                .eq('is_active', true)
                .eq('is_public', true)
                .order('start_date', { ascending: filter !== 'past' });

            if (filter === 'upcoming') {
                query = query.gte('start_date', new Date().toISOString());
            } else if (filter === 'past') {
                query = query.lt('start_date', new Date().toISOString());
            }

            const { data, error } = await query.limit(20);

            if (error) throw error;

            setEvents(data || []);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'tournament':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'lesson':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'meetup':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            default:
                return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'tournament':
                return <Trophy size={14} />;
            case 'lesson':
                return <Users size={14} />;
            case 'meetup':
                return <Calendar size={14} />;
            default:
                return <Calendar size={14} />;
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-6 font-sans text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <Panel className="flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-900 border-zinc-700 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center border-4 border-zinc-900 shadow-xl transform rotate-3">
                            <Calendar size={32} className="text-white drop-shadow-md" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-wide font-display text-stroke">
                                Events Arena
                            </h1>
                            <p className="text-zinc-400 font-bold text-sm uppercase tracking-wider">
                                Descobreix tornejos i classes
                            </p>
                        </div>
                    </div>
                    <Link href="/clubs">
                        <ShinyButton variant="primary" className="whitespace-nowrap">
                            <Plus size={16} className="mr-2" />
                            Crear Event
                        </ShinyButton>
                    </Link>
                </Panel>

                {/* Filter Tabs */}
                <div className="flex justify-center md:justify-start gap-4 p-1 bg-zinc-900/50 rounded-xl inline-flex backdrop-blur-sm border border-zinc-800">
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filter === 'upcoming'
                            ? 'bg-amber-500 text-white shadow-lg transform scale-105'
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        Propers
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filter === 'all'
                            ? 'bg-amber-500 text-white shadow-lg transform scale-105'
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        Tots
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filter === 'past'
                            ? 'bg-amber-500 text-white shadow-lg transform scale-105'
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        Passats
                    </button>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-amber-500" size={48} />
                    </div>
                ) : events.length === 0 ? (
                    <GameCard variant="default" className="text-center py-16 flex flex-col items-center justify-center border-dashed border-zinc-800 bg-zinc-900/30">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="text-zinc-600" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                            No hi ha events
                        </h3>
                        <p className="text-zinc-500 mb-6 font-medium max-w-sm">
                            Sembla que no hi ha activitat per ara. Uneix-te a un club per crear i participar en events!
                        </p>
                        <Link href="/clubs">
                            <ShinyButton variant="secondary">
                                Explorar Clubs
                            </ShinyButton>
                        </Link>
                    </GameCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {events.map((event) => (
                            <Link
                                key={event.id}
                                href={`/events/${event.id}`}
                                className="block group"
                            >
                                <GameCard
                                    variant={event.event_type === 'tournament' ? 'gold' : 'blue'}
                                    className="h-full hover:scale-[1.02] transition-transform duration-300"
                                >
                                    <div className="flex flex-col h-full">
                                        {/* Header Badges */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getEventTypeColor(event.event_type)}`}>
                                                {getEventTypeIcon(event.event_type)}
                                                {event.event_type}
                                            </div>
                                            {event.club && (
                                                <div className="px-2 py-1 bg-zinc-900/50 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-wider border border-zinc-800">
                                                    {event.club.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Title & Desc */}
                                        <h3 className="text-lg font-black text-white mb-2 leading-tight font-display uppercase group-hover:text-amber-400 transition-colors">
                                            {event.title}
                                        </h3>

                                        {event.description && (
                                            <p className="text-sm text-zinc-400 mb-6 line-clamp-2 font-medium flex-grow">
                                                {event.description}
                                            </p>
                                        )}

                                        {/* Footer Info */}
                                        <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
                                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                                <Clock size={16} className={event.event_type === 'tournament' ? 'text-amber-500' : 'text-blue-400'} />
                                                <span className="font-bold text-xs uppercase tracking-wide">
                                                    {new Date(event.start_date).toLocaleDateString('ca-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-3 text-sm text-zinc-300">
                                                    <MapPin size={16} className="text-zinc-500" />
                                                    <span className="font-medium text-xs truncate">{event.location}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                                <Users size={16} className="text-zinc-500" />
                                                <span className="font-medium text-xs">
                                                    <span className="text-white font-bold">{event.current_participants}</span>
                                                    {event.max_participants && <span className="text-zinc-500"> / {event.max_participants}</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </GameCard>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
