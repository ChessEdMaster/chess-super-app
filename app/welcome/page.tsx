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
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <div className="max-w-2xl w-full text-center space-y-12">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-8 border border-amber-400/30 rotate-3 hover:rotate-6 transition-transform duration-500">
                        <Crown className="text-white w-12 h-12 drop-shadow-md" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight font-display drop-shadow-xl">
                        Chess<span className="text-amber-500">Hub</span>
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-lg mx-auto font-light leading-relaxed">
                        Domina el tauler. Conquereix l'Arena. Converteix-te en Llegenda.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center group hover:bg-zinc-900/40 transition-colors"
                    >
                        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Swords className="text-amber-400 w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wider">Battle Arena</h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                            Desafia a altres jugadors en temps real, puja de lliga i guanya recompenses exclusives.
                        </p>
                        <Button
                            size="lg"
                            className="w-full mt-auto"
                            onClick={() => router.push('/lobby')}
                        >
                            Entrar a l'Arena
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center group hover:bg-zinc-900/40 transition-colors"
                    >
                        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen className="text-emerald-400 w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wider">Acadèmia</h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                            Mestre els fonaments i estratègies avançades amb lliçons interactives i exercicis.
                        </p>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full mt-auto"
                            onClick={() => router.push('/academy')}
                        >
                            Començar a Aprendre
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
