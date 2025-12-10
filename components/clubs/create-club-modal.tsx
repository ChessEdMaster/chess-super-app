'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Globe, Lock, School, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
                router.push(`/clubs/manage/${data.id}`);
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-yellow-500" /> Crear Nou Club
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 overflow-y-auto">

                        <div className="space-y-6">

                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nom del Club</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: Escola d'Escacs Barcelona"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition"
                                />
                            </div>

                            {/* Type Selection */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setForm({ ...form, type: 'online' })}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${form.type === 'online' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                                >
                                    <Globe size={20} />
                                    <span className="text-xs font-bold">Online</span>
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, type: 'club' })}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${form.type === 'club' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                                >
                                    <Users size={20} />
                                    <span className="text-xs font-bold">Club Físic</span>
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, type: 'school' })}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${form.type === 'school' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                                >
                                    <School size={20} />
                                    <span className="text-xs font-bold">Escola</span>
                                </button>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Descripció</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="De què tracta aquest club?"
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition resize-none"
                                />
                            </div>

                            {/* Privacy Toggle */}
                            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-3">
                                    {form.isPublic ? <Globe className="text-green-500" size={20} /> : <Lock className="text-red-500" size={20} />}
                                    <div>
                                        <div className="font-bold text-white text-sm">{form.isPublic ? 'Públic' : 'Privat'}</div>
                                        <div className="text-xs text-slate-500">{form.isPublic ? 'Tothom pot unir-se' : 'Només per invitació'}</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} />
                                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition"
                        >
                            Cancel·lar
                        </button>
                        <button
                            onClick={createClub}
                            disabled={!form.name || loading}
                            className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-3 rounded-xl font-bold shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Crear Club'}
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
