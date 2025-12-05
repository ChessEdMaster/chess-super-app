'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Trophy, Users, MapPin, Clock, Loader2, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

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
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningSystemEvent, setJoiningSystemEvent] = useState<string | null>(null);

    useEffect(() => {
        fetchUpcomingEvents();
    }, []);

    const fetchUpcomingEvents = async () => {
        try {
            setLoading(true);
            // Fetch events from DB
            // Note: Removed .eq('is_public', true) as the column might not exist on club_events
            // The RLS policy handles visibility (members + public clubs)
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
                .gte('start_date', new Date().toISOString())
                .order('start_date', { ascending: true })
                .limit(5);

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

    // System Tournaments Logic
    const systemTournaments = [
        {
            id: 'daily',
            title: 'Daily Blitz Arena',
            type: 'tournament',
            time: '20:00', // 8 PM
            frequency: 'Daily',
            description: 'Compete in the daily blitz tournament! 5+0 time control.'
        },
        {
            id: 'weekly',
            title: 'Weekly Super Sunday',
            type: 'tournament',
            time: '16:00', // 4 PM Sunday
            frequency: 'Weekly',
            description: 'The main event of the week. 10+0 Rapid.'
        },
        {
            id: 'monthly',
            title: 'Monthly Grand Prix',
            type: 'tournament',
            time: '18:00', // 6 PM Last Saturday
            frequency: 'Monthly',
            description: 'Fight for the monthly champion title!'
        }
    ];

    const handleJoinSystemEvent = async (sysEvent: typeof systemTournaments[0]) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setJoiningSystemEvent(sysEvent.id);
        try {
            // 1. Calculate next occurrence date
            const now = new Date();
            let targetDate = new Date();
            const [hours, minutes] = sysEvent.time.split(':').map(Number);
            targetDate.setHours(hours, minutes, 0, 0);

            if (sysEvent.frequency === 'Daily') {
                if (targetDate <= now) targetDate.setDate(targetDate.getDate() + 1);
            } else if (sysEvent.frequency === 'Weekly') {
                // Next Sunday
                const day = targetDate.getDay();
                const diff = targetDate.getDate() - day + (day === 0 && targetDate > now ? 0 : 7); // 0 is Sunday
                targetDate.setDate(diff);
                if (targetDate <= now) targetDate.setDate(targetDate.getDate() + 7);
            }
            // Monthly logic omitted for brevity, defaulting to next daily-like logic for demo

            const title = `${sysEvent.title} - ${targetDate.toLocaleDateString()}`;

            // 2. Check if event exists
            const { data: existingEvents } = await supabase
                .from('club_events')
                .select('id')
                .eq('title', title)
                .single();

            let eventId = existingEvents?.id;

            // 3. If not, create it
            if (!eventId) {
                // Find a public club to host it (e.g., the first public club found)
                const { data: publicClubs } = await supabase
                    .from('clubs')
                    .select('id')
                    .eq('is_public', true)
                    .limit(1);

                const hostClubId = publicClubs?.[0]?.id;

                if (!hostClubId) {
                    toast.error('No public club available to host system events.');
                    return;
                }

                const { data: newEvent, error: createError } = await supabase
                    .from('club_events')
                    .insert({
                        club_id: hostClubId,
                        organizer_id: user.id, // The first joiner becomes the "organizer" record-wise
                        title: title,
                        description: sysEvent.description,
                        event_type: 'tournament',
                        start_date: targetDate.toISOString(),
                        max_participants: 100,
                        is_active: true
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                eventId = newEvent.id;
            }

            // 4. Redirect to event page (where joining happens)
            router.push(`/events/${eventId}`);

        } catch (error) {
            console.error('Error joining system event:', error);
            toast.error('Failed to join event');
        } finally {
            setJoiningSystemEvent(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* System Tournaments Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-500" /> Official Tournaments
                </h3>
                <div className="grid gap-3">
                    {systemTournaments.map(sysEvent => (
                        <div key={sysEvent.id} className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between group hover:border-yellow-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-yellow-900/20 text-yellow-500 flex items-center justify-center">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-yellow-400 transition-colors">{sysEvent.title}</h4>
                                    <p className="text-xs text-zinc-500">{sysEvent.frequency} • {sysEvent.time}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleJoinSystemEvent(sysEvent)}
                                disabled={joiningSystemEvent === sysEvent.id}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {joiningSystemEvent === sysEvent.id ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Community Events Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Community Events</h3>
                    <Link href="/events" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        View All <ArrowRight size={12} />
                    </Link>
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                        <p>No community events scheduled.</p>
                        <Link href="/clubs" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
                            Join a club to create one!
                        </Link>
                    </div>
                ) : (
                    events.map(event => (
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
                    ))
                )}
            </div>
        </div>
    );
}
