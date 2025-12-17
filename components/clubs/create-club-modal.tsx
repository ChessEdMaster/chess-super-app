'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Globe, Lock, School, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

interface CreateClubModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

type ClubType = 'online' | 'club' | 'school';

export function CreateClubModal({ isOpen, onClose, userId }: CreateClubModalProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        type: 'online' as ClubType,
        isPublic: true
    });

    const createClub = async () => {
        if (!userId || !form.name.trim()) return;

        setLoading(true);
        try {
            const slug = form.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            // 1. Create Club
            const { data, error } = await supabase
                .from('clubs')
                .insert({
                    name: form.name.trim(),
                    slug: slug,
                    description: form.description.trim() || null,
                    owner_id: userId,
                    is_public: form.isPublic,
                    type: form.type,
                    member_count: 1
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Add Owner as Member
            await supabase
                .from('club_members')
                .insert({
                    club_id: data.id,
                    user_id: userId,
                    role: 'owner'
                });

            toast.success('Club creat amb èxit!');
            // Delay for UX
            setTimeout(() => {
                router.push(`/clubs/${data.id}`);
                onClose();
            }, 500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al crear el club');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-lg"
                >
                    <GameCard variant="default" className="w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] p-0">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
                            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide font-display text-stroke">
                                <Shield className="text-amber-500" /> Crear Nou Clan
                            </h2>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition bg-zinc-800 p-2 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">

                            <div className="space-y-6">

                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Nom del Clan</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ex: Escola d'Escacs Barcelona"
                                        className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition font-bold shadow-inner placeholder:text-zinc-600"
                                    />
                                </div>

                                {/* Type Selection */}
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setForm({ ...form, type: 'online' })}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition group ${form.type === 'online' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                    >
                                        <Globe size={24} className={`transition-transform duration-300 group-hover:scale-110 ${form.type === 'online' ? 'text-amber-500' : 'text-zinc-500'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Online</span>
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, type: 'club' })}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition group ${form.type === 'club' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                    >
                                        <Users size={24} className={`transition-transform duration-300 group-hover:scale-110 ${form.type === 'club' ? 'text-amber-500' : 'text-zinc-500'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Club Físic</span>
                                    </button>
                                    <button
                                        onClick={() => setForm({ ...form, type: 'school' })}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition group ${form.type === 'school' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                    >
                                        <School size={24} className={`transition-transform duration-300 group-hover:scale-110 ${form.type === 'school' ? 'text-amber-500' : 'text-zinc-500'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Escola</span>
                                    </button>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Descripció</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="De què tracta aquest clan?"
                                        rows={3}
                                        className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition resize-none font-medium shadow-inner placeholder:text-zinc-600"
                                    />
                                </div>

                                {/* Privacy Toggle */}
                                <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${form.isPublic ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {form.isPublic ? <Globe size={20} /> : <Lock size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-black text-white text-xs uppercase tracking-wider">{form.isPublic ? 'Públic' : 'Privat'}</div>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase">{form.isPublic ? 'Tothom pot unir-se' : 'Només per invitació'}</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} />
                                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex gap-4">
                            <ShinyButton variant="neutral" onClick={onClose} className="flex-1">
                                Cancel·lar
                            </ShinyButton>
                            <ShinyButton
                                variant="primary"
                                onClick={createClub}
                                disabled={!form.name || loading}
                                className="flex-1"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Crear Clan'}
                            </ShinyButton>
                        </div>
                    </GameCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
