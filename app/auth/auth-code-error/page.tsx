'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 font-display">Error d'Autenticació</h1>
                <p className="text-zinc-400 mb-8">
                    Hi ha hagut un problema iniciant sessió. Això pot passar si l'enllaç ha caducat o si hi ha hagut un error de xarxa.
                </p>

                <div className="flex flex-col gap-3 w-full">
                    <Button
                        className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
                        onClick={() => router.push('/login')}
                    >
                        Tornar a provar
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-white"
                        onClick={() => router.push('/')}
                    >
                        Anar a l'inici
                    </Button>
                </div>
            </div>
        </div>
    );
}
