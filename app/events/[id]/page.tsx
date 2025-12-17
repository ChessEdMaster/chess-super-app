'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Loader2, Trophy, Shield } from 'lucide-react';
import { EventRegistration } from '@/components/events/event-registration';
import { toast } from 'sonner';
import Link from 'next/link';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Panel } from '@/components/ui/design-system/Panel';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    start_date: string;
    end_date: string | null;
    location: string | null;
    max_participants: number | null;
    participants_count: number;
    organizer_id: string;
    club_id: string | null;
    is_public: boolean;
    created_at: string;
    club?: {
        name: string;
        slug: string;
        image_url?: string;
    };
}

function Countdown({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const formatTime = (value: number) => value < 10 ? `0${value}` : value;

    // @ts-ignore
    if (!timeLeft.hours && !timeLeft.minutes && !timeLeft.seconds) {
        return <span className="text-2xl font-black text-emerald-400 uppercase tracking-widest animate-pulse">Started!</span>;
    }

    return (
        <div className="flex gap-4 text-center">
            {/* @ts-ignore */}
            {timeLeft.days > 0 && (
                <div className="flex flex-col bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 min-w-[70px]">
                    {/* @ts-ignore */}
                    <span className="text-3xl font-black text-white font-mono">{formatTime(timeLeft.days)}</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Days</span>
                </div>
            )}
            <div className="flex flex-col bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 min-w-[70px]">
                {/* @ts-ignore */}
                <span className="text-3xl font-black text-white font-mono">{formatTime(timeLeft.hours || 0)}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Hours</span>
            </div>
            <div className="flex flex-col bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 min-w-[70px]">
                {/* @ts-ignore */}
                <span className="text-3xl font-black text-white font-mono">{formatTime(timeLeft.minutes || 0)}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Mins</span>
            </div>
            <div className="flex flex-col bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 min-w-[70px]">
                {/* @ts-ignore */}
                <span className="text-3xl font-black text-amber-500 font-mono">{formatTime(timeLeft.seconds || 0)}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Secs</span>
            </div>
        </div>
    );
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && eventId) {
            loadEvent();
        }
    }, [user, eventId]);

    const loadEvent = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('club_events')
                .select(`
                    *,
                    club:clubs(name, slug, image_url)
                `)
                .eq('id', eventId)
                .single();

            if (error) throw error;

            if (!data) {
                toast.error('Event not found');
                router.push('/events');
                return;
            }

            setEvent(data);
        } catch (error) {
            console.error('Error loading event:', error);
            toast.error('Failed to load event');
            router.push('/events');
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
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default:
                return 'bg-zinc-800 text-zinc-400 border-zinc-700';
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

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    if (!event) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Back Button */}
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-wider group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Events
                </Link>

                {/* Event Header */}
                <Panel className="p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getEventTypeColor(event.event_type)}`}>
                                {getEventTypeIcon(event.event_type)}
                                {event.event_type}
                            </div>
                            {!event.is_public && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    <Shield size={12} />
                                    Private
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-wide font-display text-stroke shadow-black drop-shadow-lg leading-tight">
                            {event.title}
                        </h1>

                        {event.description && (
                            <p className="text-zinc-300 text-lg mb-8 font-medium leading-relaxed max-w-2xl bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                {event.description}
                            </p>
                        )}

                        {/* Countdown */}
                        {new Date(event.start_date) > new Date() && (
                            <div className="mb-8 flex flex-col items-center justify-center text-center p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-amber-500 text-xs uppercase tracking-[0.2em] font-black mb-4 flex items-center gap-2">
                                    <Clock size={14} /> Only Time Remaining
                                </p>
                                <Countdown targetDate={event.start_date} />
                            </div>
                        )}

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GameCard variant="default" className="flex items-center gap-4 p-4 border-zinc-800 bg-zinc-900/80">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Clock size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Start Date</p>
                                    <p className="text-white font-bold text-lg">
                                        {new Date(event.start_date).toLocaleDateString('ca-ES', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'long',
                                        })}
                                    </p>
                                    <p className="text-blue-400 text-sm font-black">
                                        {new Date(event.start_date).toLocaleTimeString('ca-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </GameCard>

                            {event.location && (
                                <GameCard variant="default" className="flex items-center gap-4 p-4 border-zinc-800 bg-zinc-900/80">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <MapPin size={24} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Location</p>
                                        <p className="text-white font-bold text-lg">{event.location}</p>
                                    </div>
                                </GameCard>
                            )}
                        </div>

                        {/* Club Info */}
                        {event.club && (
                            <div className="mt-6">
                                <Link
                                    href={`/clubs/${event.club.slug}`}
                                    className="inline-flex items-center gap-4 bg-zinc-900/80 hover:bg-zinc-800 p-4 rounded-xl transition-all border border-zinc-800 hover:border-amber-500/50 group"
                                >
                                    {event.club.image_url ? (
                                        <img
                                            src={event.club.image_url}
                                            alt={event.club.name}
                                            className="w-12 h-12 rounded-xl border-2 border-zinc-800 group-hover:border-amber-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 group-hover:border-amber-500 transition-colors">
                                            <Users className="text-zinc-400 group-hover:text-amber-500" size={24} />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest group-hover:text-amber-500/70 transition-colors">Organized by</p>
                                        <p className="text-white font-bold text-lg">{event.club.name}</p>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </Panel>

                {/* Registration Section */}
                <GameCard variant="gold" className="p-8">
                    <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wide flex items-center gap-3">
                        <Users className="text-amber-500" />
                        Registration
                    </h2>
                    <EventRegistration
                        eventId={event.id}
                        maxParticipants={event.max_participants}
                        currentParticipants={event.participants_count}
                        onParticipantsUpdate={(count) => {
                            setEvent({ ...event, participants_count: count });
                        }}
                    />
                </GameCard>
            </div>
        </div>
    );
}
