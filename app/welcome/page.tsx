'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Trophy, Swords, BookOpen, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6">
                        <Crown className="text-white w-12 h-12" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Benvingut a ChessHub!
                    </h1>
                    <p className="text-xl text-slate-400 max-w-lg mx-auto">
                        La teva aventura d'escacs comença aquí. Has completat el registre correctament.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-4">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors"
                    >
                        <Swords className="text-indigo-400 w-8 h-8 mb-4 mx-auto" />
                        <h3 className="text-lg font-bold text-white mb-2">Juga a l'Arena</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Desafia a altres jugadors, puja de rang i guanya cofres.
                        </p>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-500"
                            onClick={() => router.push('/lobby')}
                        >
                            Anar al Lobby
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-colors"
                    >
                        <BookOpen className="text-purple-400 w-8 h-8 mb-4 mx-auto" />
                        <h3 className="text-lg font-bold text-white mb-2">Aprèn a l'Acadèmia</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Millora el teu joc amb lliçons interactives i exercicis.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full border-slate-700 hover:bg-slate-800"
                            onClick={() => router.push('/academy')}
                        >
                            Anar a l'Acadèmia
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
