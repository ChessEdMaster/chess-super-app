'use client';

import { useAuth } from '@/components/auth-provider';
import { Trophy, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const { signInWithGoogle, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) router.push('/profile'); // Redirigir si ja està loguejat
    }, [user, router]);

    const handleRegister = async () => {
        // We use the same Google Sign In, but the callback will handle the profile creation
        // To distinguish, we might set a cookie or local storage, but for now, 
        // let's rely on the callback logic to create profile if not exists.
        // However, the user requested that LOGIN should fail if not registered.
        // So we need to pass a param to the callback.

        // Since we can't easily pass params to the OAuth callback URL dynamically via the simple SDK method without changing the redirect URL in Supabase console,
        // we will use localStorage to store the intent.
        localStorage.setItem('auth_intent', 'register');
        await signInWithGoogle();
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-800 p-4 rounded-full">
                        <UserPlus size={48} className="text-purple-500" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Crea el teu compte</h1>
                <p className="text-slate-400 mb-8">Uneix-te a la comunitat de ChessHub i comença la teva aventura.</p>

                <button
                    onClick={handleRegister}
                    className="w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Registrar-se amb Google
                </button>

                <div className="text-slate-400 text-sm">
                    Ja tens compte? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">Inicia sessió</Link>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                    <Link href="/" className="text-slate-500 hover:text-white text-sm flex items-center justify-center gap-1 transition">
                        <ArrowLeft size={14} /> Tornar a l'inici
                    </Link>
                </div>
            </div>
        </div>
    );
}
