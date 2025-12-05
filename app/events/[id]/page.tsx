'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Loader2, Trophy, Shield } from 'lucide-react';
import { EventRegistration } from '@/components/events/event-registration';
import { toast } from 'sonner';
import Link from 'next/link';

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
        return <span className="text-2xl font-bold text-white">Started!</span>;
    }

    return (
        <div className="flex gap-4 text-center">
            {/* @ts-ignore */}
            {timeLeft.days > 0 && (
                <div className="flex flex-col">
                    {/* @ts-ignore */}
                    <span className="text-4xl font-black text-white">{formatTime(timeLeft.days)}</span>
                    <span className="text-xs text-slate-500 uppercase">Days</span>
                </div>
            )}
            <div className="flex flex-col">
                {/* @ts-ignore */}
                <span className="text-4xl font-black text-white">{formatTime(timeLeft.hours || 0)}</span>
                <span className="text-xs text-slate-500 uppercase">Hours</span>
            </div>
            <div className="flex flex-col">
                {/* @ts-ignore */}
                <span className="text-4xl font-black text-white">{formatTime(timeLeft.minutes || 0)}</span>
                <span className="text-xs text-slate-500 uppercase">Mins</span>
            </div>
            <div className="flex flex-col">
                {/* @ts-ignore */}
                <span className="text-4xl font-black text-white">{formatTime(timeLeft.seconds || 0)}</span>
                <span className="text-xs text-slate-500 uppercase">Secs</span>
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
                return <Trophy size={24} />;
            case 'lesson':
                return <Users size={24} />;
            case 'meetup':
                return <Calendar size={24} />;
            default:
                return <Calendar size={24} />;
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (!event) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft size={20} />
                    Back to Events
                </Link>

                {/* Event Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider ${getEventTypeColor(event.event_type)}`}>
                            {getEventTypeIcon(event.event_type)}
                            {event.event_type}
                        </div>
                        {!event.is_public && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">
                                <Shield size={14} />
                                Private
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4">{event.title}</h1>

                    {event.description && (
                        <p className="text-slate-300 text-lg mb-6 whitespace-pre-wrap">
                            {event.description}
                        </p>
                    )}

                    {/* Countdown */}
                    {new Date(event.start_date) > new Date() && (
                        <div className="mb-8 p-6 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-2">Tournament Starts In</p>
                            <Countdown targetDate={event.start_date} />
                        </div>
                    )}

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg">
                            <Clock size={24} className="text-purple-400" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Start Date</p>
                                <p className="text-white font-medium">
                                    {new Date(event.start_date).toLocaleDateString('en-GB', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="text-slate-400 text-sm">
                                    {new Date(event.start_date).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        {event.location && (
                            <div className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg">
                                <MapPin size={24} className="text-purple-400" />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Location</p>
                                    <p className="text-white font-medium">{event.location}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Club Info */}
                    {event.club && (
                        <Link
                            href={`/clubs/${event.club.slug}`}
                            className="inline-flex items-center gap-3 bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition border border-slate-700 hover:border-purple-500/50"
                        >
                            {event.club.image_url ? (
                                <img
                                    src={event.club.image_url}
                                    alt={event.club.name}
                                    className="w-12 h-12 rounded-full border-2 border-purple-500/50"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/50">
                                    <Users className="text-purple-400" size={24} />
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Organized by</p>
                                <p className="text-white font-bold">{event.club.name}</p>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Registration Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Registration</h2>
                    <EventRegistration
                        eventId={event.id}
                        maxParticipants={event.max_participants}
                        currentParticipants={event.participants_count}
                        onParticipantsUpdate={(count) => {
                            setEvent({ ...event, participants_count: count });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
