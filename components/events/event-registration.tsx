'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Users, UserPlus, UserMinus, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface EventRegistrationProps {
    eventId: string;
    maxParticipants: number | null;
    currentParticipants: number;
    onParticipantsUpdate?: (count: number) => void;
}

interface Participant {
    id: string;
    user_id: string;
    status: string;
    registered_at: string;
    profiles?: {
        username: string;
        avatar_url?: string;
    };
}

export function EventRegistration({
    eventId,
    maxParticipants,
    currentParticipants,
    onParticipantsUpdate
}: EventRegistrationProps) {
    const { user } = useAuth();
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);

    useEffect(() => {
        if (user) {
            checkRegistration();
            loadParticipants();
        }
    }, [user, eventId]);

    const checkRegistration = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('event_participants')
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', user.id)
                .eq('status', 'registered')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            setIsRegistered(!!data);
        } catch (error) {
            console.error('Error checking registration:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadParticipants = async () => {
        try {
            const { data, error } = await supabase
                .from('event_participants')
                .select(`
                    *,
                    profiles!fk_event_participants_user_profile(username, avatar_url)
                `)
                .eq('event_id', eventId)
                .eq('status', 'registered')
                .order('registered_at', { ascending: true });

            if (error) throw error;

            setParticipants(data || []);
        } catch (error) {
            console.error('Error loading participants:', error);
        }
    };

    const handleRegister = async () => {
        if (!user || actionLoading) return;

        // Check if event is full
        if (maxParticipants && currentParticipants >= maxParticipants) {
            toast.error('Event is full!');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('event_participants')
                .insert({
                    event_id: eventId,
                    user_id: user.id,
                    status: 'registered'
                });

            if (error) {
                // Check if already registered
                if (error.code === '23505') {
                    toast.info('You are already registered');
                    setIsRegistered(true);
                    return;
                }
                throw error;
            }

            setIsRegistered(true);
            toast.success('Successfully registered!');
            await loadParticipants();
            onParticipantsUpdate?.(currentParticipants + 1);
        } catch (error: any) {
            console.error('Error registering:', error);
            toast.error('Failed to register');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnregister = async () => {
        if (!user || actionLoading) return;

        if (!confirm('Are you sure you want to cancel your participation?')) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('event_participants')
                .update({ status: 'cancelled' })
                .eq('event_id', eventId)
                .eq('user_id', user.id);

            if (error) throw error;

            setIsRegistered(false);
            toast.success('Registration cancelled');
            await loadParticipants();
            onParticipantsUpdate?.(currentParticipants - 1);
        } catch (error) {
            console.error('Error unregistering:', error);
            toast.error('Failed to cancel registration');
        } finally {
            setActionLoading(false);
        }
    };

    const isFull = maxParticipants ? currentParticipants >= maxParticipants : false;

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-purple-500" size={20} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Registration Button */}
            <div className="flex items-center gap-3">
                {isRegistered ? (
                    <button
                        onClick={handleUnregister}
                        disabled={actionLoading}
                        className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-6 py-3 rounded-lg font-bold transition border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {actionLoading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <Check size={18} />
                                Registered
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleRegister}
                        disabled={actionLoading || isFull}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {actionLoading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <UserPlus size={18} />
                                {isFull ? 'Event Full' : 'Register'}
                            </>
                        )}
                    </button>
                )}

                <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg transition"
                >
                    <Users size={18} />
                    <span>
                        {participants.length}
                        {maxParticipants && ` / ${maxParticipants}`}
                    </span>
                </button>
            </div>

            {/* Participants List */}
            {showParticipants && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-white mb-4">Participants</h4>
                    {participants.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">
                            No participants yet. Be the first to register!
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {participants.map((participant, index) => (
                                <div
                                    key={participant.id}
                                    className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition"
                                >
                                    <span className="text-xs text-slate-600 w-6">#{index + 1}</span>
                                    <Link href={`/profile/${participant.user_id}`}>
                                        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-zinc-400 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500">
                                            {participant.profiles?.avatar_url ? (
                                                <img
                                                    src={participant.profiles.avatar_url}
                                                    alt={participant.profiles.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                participant.profiles?.username?.[0]?.toUpperCase() || 'U'
                                            )}
                                        </div>
                                    </Link>
                                    <Link href={`/profile/${participant.user_id}`}>
                                        <p className="text-sm font-medium text-white hover:text-purple-400 cursor-pointer">
                                            {participant.profiles?.username || 'User'}
                                        </p>
                                    </Link>
                                    {participant.user_id === user?.id && (
                                        <span className="ml-auto text-xs text-purple-400 font-bold">
                                            You
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
