'use client';

import { useAuth } from '@/components/auth-provider';
import { Trophy, ArrowLeft, UserPlus, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';

export default function RegisterPage() {
    const { signInWithGoogle, user } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) router.push('/profile');
    }, [user, router]);

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: username,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else if (data.user) {
            // Create profile
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                username: username,
                level: 1,
                xp: 0,
                gold: 0,
                gems: 0,
                attributes: { AGGRESSION: 0, SOLIDITY: 0, KNOWLEDGE: 0, SPEED: 0 },
                cards: [],
                chests: []
            });

            if (profileError) {
                console.error('Error creating profile:', profileError);
            }

            router.push('/');
        }
    };

    const handleRegister = async () => {
        localStorage.setItem('auth_intent', 'register');
        await signInWithGoogle();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
            <GameCard className="w-full max-w-md flex flex-col items-center text-center p-8 bg-zinc-900/95 border-amber-600/50 shadow-2xl">
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30" />
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center border-t-2 border-purple-400 shadow-[0_4px_0_#7e22ce] relative z-10 rotate-3">
                        <UserPlus size={40} className="text-white drop-shadow-md" />
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white mb-2 font-display uppercase tracking-wide text-stroke">Crea el teu compte</h1>
                <p className="text-purple-100/60 mb-8 font-medium">Uneix-te als Clans i comença la teva llegenda</p>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailRegister} className="w-full mb-6 space-y-4">
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Nom d'usuari"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full bg-black/40 text-white pl-12 pr-4 py-4 rounded-xl border-2 border-zinc-700 focus:border-purple-500 focus:outline-none transition-all shadow-inner font-bold placeholder:font-normal placeholder:text-zinc-600"
                        />
                    </div>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input
                            type="email"
                            placeholder="Correu electrònic"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-black/40 text-white pl-12 pr-4 py-4 rounded-xl border-2 border-zinc-700 focus:border-purple-500 focus:outline-none transition-all shadow-inner font-bold placeholder:font-normal placeholder:text-zinc-600"
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                        <input
                            type="password"
                            placeholder="Contrasenya (mínim 6 caràcters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-black/40 text-white pl-12 pr-4 py-4 rounded-xl border-2 border-zinc-700 focus:border-purple-500 focus:outline-none transition-all shadow-inner font-bold placeholder:font-normal placeholder:text-zinc-600"
                        />
                    </div>
                    {error && (
                        <div className="text-red-200 text-sm bg-red-900/50 p-3 rounded-lg border border-red-500/50 font-bold">
                            {error}
                        </div>
                    )}
                    <ShinyButton
                        variant="success"
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Creant compte...' : 'Registrar-se'}
                    </ShinyButton>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6 w-full px-4">
                    <div className="flex-1 h-0.5 bg-zinc-700"></div>
                    <span className="text-zinc-500 text-sm font-bold uppercase">o</span>
                    <div className="flex-1 h-0.5 bg-zinc-700"></div>
                </div>

                {/* Google Register */}
                <ShinyButton
                    variant="neutral"
                    onClick={handleRegister}
                    className="w-full !bg-white !text-zinc-900 !border-gray-300"
                >
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        Registrar-se amb Google
                    </div>
                </ShinyButton>

                <div className="text-zinc-400 text-sm mt-8 font-medium">
                    Ja tens compte? <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold hover:underline">Inicia sessió</Link>
                </div>

                <div className="mt-8 pt-6 border-t-2 border-zinc-800 w-full">
                    <Link href="/" className="text-zinc-500 hover:text-white text-sm flex items-center justify-center gap-2 transition font-bold uppercase tracking-wider group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Tornar a l'inici
                    </Link>
                </div>
            </GameCard>
        </div>
    );
}
