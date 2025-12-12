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

import { MapaEscacsWrapper } from '@/components/mapa/MapaEscacsWrapper'; // We will create this wrapper
import { cn } from '@/lib/utils'; // Make sure utils are imported

// ... existing imports ...

export function EventsView() {
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningSystemEvent, setJoiningSystemEvent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'online' | 'presential'>('online'); // New State

    // Re-fetch events when tab is 'online' or just once on mount
    useEffect(() => {
        if (activeTab === 'online') {
            fetchUpcomingEvents();
        }
    }, [activeTab]);

    // ... existing fetchUpcomingEvents ...
    // ... existing getEventTypeColor ...
    // ... existing systemTournaments ...
    // ... existing handleJoinSystemEvent ...

    if (loading && activeTab === 'online') {
        // ...
    }

    return (
        <div className="h-full flex flex-col">
            {/* View Mode Toggle */}
            <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-lg flex gap-1">
                    <button
                        onClick={() => setActiveTab('online')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                            activeTab === 'online' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        App Events
                    </button>
                    <button
                        onClick={() => setActiveTab('presential')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                            activeTab === 'presential' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Live Map
                    </button>
                </div>
            </div>

            {/* TAB: ONLINE EVENTS */}
            {activeTab === 'online' && (
                <div className="max-w-2xl mx-auto space-y-6 w-full animate-in fade-in duration-500">
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
            )}

            {/* TAB: PRESENTIAL MAP */}
            {activeTab === 'presential' && (
                <div className="flex-1 h-full w-full min-h-[600px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                    <MapaEscacsWrapper />
                </div>
            )}
        </div>
    );
}
