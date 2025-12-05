'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Trophy, Users, MapPin, Clock, Loader2, ArrowRight } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_type: 'tournament' | 'lesson' | 'meetup' | 'other';
    start_date: string;
    location: string | null;
    current_participants: number;
    max_participants: number | null;
    club?: {
        name: string;
    } | { name: string }[];
}

export function EventsView() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpcomingEvents();
    }, []);

    const fetchUpcomingEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('club_events')
                .select(`
                    id,
                    title,
                    description,
                    event_type,
                    start_date,
                    location,
                    current_participants,
                    max_participants,
                    club:clubs(name)
                `)
                .eq('is_active', true)
                .eq('is_public', true)
                .gte('start_date', new Date().toISOString())
                .order('start_date', { ascending: true })
                .limit(3);

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
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

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-zinc-500" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
                <Calendar size={48} className="mx-auto text-zinc-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No upcoming events</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    There are no public events scheduled right now. Check back later!
                </p>
                <Link href="/clubs">
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-colors text-sm">
                        Find a Club
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Upcoming Events</h3>
                <Link href="/events" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View All <ArrowRight size={12} />
                </Link>
            </div>

            {events.map(event => (
                <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getEventTypeColor(event.event_type)}`}>
                                {event.event_type}
                            </span>
                            <div className="flex items-center gap-1 text-zinc-400 text-xs">
                                <Clock size={12} />
                                <span>
                                    {new Date(event.start_date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{event.title}</h3>

                        {event.club && (
                            <p className="text-xs text-zinc-500 mb-3">by {Array.isArray(event.club) ? event.club[0]?.name : event.club.name}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <div className="flex items-center gap-1">
                                <Users size={12} />
                                <span>{event.current_participants}{event.max_participants ? `/${event.max_participants}` : ''}</span>
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    <span className="truncate max-w-[150px]">{event.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
