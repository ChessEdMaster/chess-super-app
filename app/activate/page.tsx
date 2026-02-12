'use client';

import React, { useState } from 'react';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { KeyRound, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { playSound } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivatePage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const { user } = useAuth();
    const router = useRouter();

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !user) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const { data, error } = await supabase.rpc('redeem_activation_code', {
                p_code: code.trim().toUpperCase(),
                p_user_id: user.id
            });

            if (error) throw error;

            if (data && data.success) {
                setStatus('success');
                setMessage(data.message);
                playSound('game_end'); // Or a 'success' sound
                setCode('');
                // Maybe refresh session or entitlements?
            } else {
                setStatus('error');
                setMessage(data?.message || 'Codi invàlid o ja utilitzat.');
                playSound('illegal');
            }
        } catch (err: any) {
            console.error('Error redeeming code:', err);
            setStatus('error');
            setMessage(err.message || 'Error en processar el codi.');
            playSound('illegal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />

            <Panel className="max-w-md w-full p-8 md:p-10 relative z-10 border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 mb-6">
                        <KeyRound size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Activar Codi</h1>
                    <p className="text-zinc-400">
                        Introdueix el teu codi d&apos;activació per desbloquejar contingut exclusiu, cursos o millores.
                    </p>
                </div>

                <form onSubmit={handleRedeem} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="ABCD-1234-XYZ9"
                            className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                            disabled={loading || status === 'success'}
                        />
                    </div>

                    <AnimatePresence mode='wait'>
                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm flex items-center justify-center gap-2"
                            >
                                <XCircle size={16} />
                                {message}
                            </motion.div>
                        )}
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} />
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ShinyButton
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="w-full py-4 text-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" /> Processant...</>
                        ) : (
                            'Bescanviar Codi'
                        )}
                    </ShinyButton>
                </form>

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 pt-6 border-t border-zinc-800 text-center"
                    >
                        <button
                            onClick={() => router.push('/academy')}
                            className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                        >
                            Anar als meus Cursos &rarr;
                        </button>
                    </motion.div>
                )}
            </Panel>
        </div>
    );
}
