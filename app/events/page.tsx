'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Trophy, Users, MapPin, Clock, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
                return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
            case 'lesson':
                return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
            case 'meetup':
                return 'bg-purple-900/30 text-purple-400 border-purple-500/30';
            default:
                return 'bg-zinc-900/30 text-zinc-400 border-zinc-500/30';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'tournament':
                return <Trophy size={16} />;
            case 'lesson':
                return <Users size={16} />;
            case 'meetup':
                return <Calendar size={16} />;
            default:
                return <Calendar size={16} />;
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                            <Calendar size={40} className="text-purple-500" />
                            Events Arena
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            Descobreix tornejos, classes i esdeveniments de la comunitat d'escacs
                        </p>
                    </div>
                    <Link
                        href="/clubs"
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-purple-900/50 mt-4 md:mt-0"
                    >
                        <Plus size={20} />
                        Unir-se a un Club per Crear Events
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-800">
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`px-4 py-2 font-medium transition ${filter === 'upcoming'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Propers Events
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 font-medium transition ${filter === 'all'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Tots
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`px-4 py-2 font-medium transition ${filter === 'past'
                                ? 'text-purple-400 border-b-2 border-purple-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Passats
                    </button>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-purple-500" size={48} />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
                        <Calendar className="mx-auto text-slate-700 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">
                            No hi ha events disponibles
                        </h3>
                        <p className="text-slate-500 mb-4">
                            Uneix-te a un club per crear i participar en events
                        </p>
                        <Link
                            href="/clubs"
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition"
                        >
                            Explorar Clubs
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition group cursor-pointer shadow-lg hover:shadow-purple-900/20"
                            >
                                {/* Event Type Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getEventTypeColor(event.event_type)}`}>
                                        {getEventTypeIcon(event.event_type)}
                                        {event.event_type}
                                    </div>
                                </div>

                                {/* Event Title */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                    {event.title}
                                </h3>

                                {/* Event Description */}
                                {event.description && (
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {event.description}
                                    </p>
                                )}

                                {/* Event Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Clock size={16} className="text-purple-400" />
                                        <span>
                                            {new Date(event.start_date).toLocaleDateString('ca-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <MapPin size={16} className="text-purple-400" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Users size={16} className="text-purple-400" />
                                        <span>
                                            {event.current_participants}
                                            {event.max_participants && ` / ${event.max_participants}`} participants
                                        </span>
                                    </div>
                                </div>

                                {/* Club Badge */}
                                {event.club && (
                                    <Link
                                        href={`/clubs/${event.club.slug}`}
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-medium text-purple-400 transition"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Users size={12} />
                                        {event.club.name}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
