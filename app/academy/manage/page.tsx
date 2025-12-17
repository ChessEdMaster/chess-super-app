'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Layout, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';

export default function AcademyManagePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <GameCard variant="default" className="p-8 text-center max-w-md">
                    <p className="mb-6 text-zinc-400 font-bold">Necessites iniciar sessió per accedir a aquesta àrea.</p>
                    <Link href="/login">
                        <ShinyButton variant="primary" className="w-full">
                            Iniciar Sessió
                        </ShinyButton>
                    </Link>
                </GameCard>
            </div>
        );
    }

    return (
        <div className="h-full p-6 pb-24 max-w-6xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <Panel className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-zinc-900/90 border-zinc-700">
                <div className="flex flex-col gap-2">
                    <Link
                        href="/academy"
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition text-xs font-bold uppercase tracking-wider mb-1"
                    >
                        <ArrowLeft size={16} /> Tornar a l&apos;Acadèmia
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg border border-indigo-500/50">
                            <Layout className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display text-stroke">
                                Gestió de S.A.
                            </h1>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                Dissenya i gestiona les Situacions d&apos;Aprenentatge (LOMLOE).
                            </p>
                        </div>
                    </div>
                </div>

                <Link href="/academy/manage/create" className="mt-4 md:mt-0">
                    <ShinyButton variant="primary" className="px-6 py-4">
                        <Plus size={20} className="mr-2" />
                        Nova S.A.
                    </ShinyButton>
                </Link>
            </Panel>

            {/* Content Placeholder (List of Created SAs) */}
            <GameCard variant="default" className="p-12 text-center border-dashed border-zinc-700 bg-zinc-900/50 min-h-[400px] flex flex-col items-center justify-center">
                <Layout className="text-zinc-800 mb-6" size={64} />
                <h3 className="text-xl font-black text-zinc-600 mb-2 uppercase tracking-wide">Work In Progress</h3>
                <p className="text-zinc-500 font-medium max-w-md mx-auto">
                    Aquesta àrea mostrarà la llista de Situacions d&apos;Aprenentatge que hagis creat.
                </p>
                <div className="mt-8 opacity-50 pointer-events-none">
                    <ShinyButton variant="neutral" className="px-8">
                        Veure Exemples
                    </ShinyButton>
                </div>
            </GameCard>
        </div>
    );
}
