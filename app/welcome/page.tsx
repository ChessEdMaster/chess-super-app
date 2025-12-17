'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { useRouter } from 'next/navigation';
import { Trophy, Swords, BookOpen, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            {/* Auth Buttons */}
            <div className="absolute top-6 right-6 flex gap-4 z-20">
                <Button
                    variant="ghost"
                    className="text-zinc-300 hover:text-white hover:bg-white/10 font-display uppercase tracking-widest font-bold"
                    onClick={() => router.push('/login')}
                >
                    Iniciar Sessió
                </Button>
                <ShinyButton
                    variant="primary"
                    onClick={() => router.push('/register')}
                    className="min-w-[140px]"
                >
                    Registrar-se
                </ShinyButton>
            </div>

            <div className="max-w-4xl w-full text-center space-y-12">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="flex flex-col items-center"
                >
                    {/* Logo/Crown */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20" />
                        <div className="w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-[0_10px_0_#b45309] border-t-4 border-amber-300 rotate-3 hover:rotate-6 transition-transform duration-500 relative z-10">
                            <Crown className="text-white w-14 h-14 drop-shadow-md" />
                        </div>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight font-display drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] text-stroke">
                        Chess <span className="text-gold-gradient">Clans</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
                        Domina el tauler. Conquereix l'Arena. <br />Converteix-te en Llegenda.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Battle Arena Card */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GameCard variant="blue" className="h-full flex flex-col items-center text-center p-8 group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-lg border-t-2 border-blue-400 group-hover:scale-110 transition-transform">
                                <Swords className="text-white w-10 h-10 drop-shadow-md" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 font-display uppercase tracking-wider text-stroke">Battle Arena</h3>
                            <p className="text-blue-100/80 text-sm mb-8 leading-relaxed font-medium">
                                Desafia a altres jugadors en temps real, puja de lliga i guanya cofres exclusius.
                            </p>
                            <ShinyButton
                                variant="secondary"
                                className="w-full mt-auto"
                                onClick={() => router.push('/login')}
                            >
                                Jugar Ara
                            </ShinyButton>
                        </GameCard>
                    </motion.div>

                    {/* Academy Card */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <GameCard variant="gold" className="h-full flex flex-col items-center text-center p-8 group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-6 shadow-lg border-t-2 border-emerald-400 group-hover:scale-110 transition-transform">
                                <BookOpen className="text-white w-10 h-10 drop-shadow-md" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3 font-display tracking-wider text-stroke">Acadèmia</h3>
                            <p className="text-amber-100/80 text-sm mb-8 leading-relaxed font-medium">
                                Mestre els fonaments i estratègies amb lliçons interactives i exercicis tàctics.
                            </p>
                            <ShinyButton
                                variant="success"
                                className="w-full mt-auto"
                                onClick={() => router.push('/register')}
                            >
                                Aprendre
                            </ShinyButton>
                        </GameCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
