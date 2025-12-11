'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Layout, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export default function AcademyManagePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4">
                <p className="mb-4">Necessites iniciar sessió per accedir a aquesta àrea.</p>
                <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                    Iniciar Sessió
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href="/academy"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition mb-2 text-sm"
                        >
                            <ArrowLeft size={16} /> Tornar a l&apos;Acadèmia
                        </Link>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <Layout className="text-indigo-500" />
                            Gestió de S.A.
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Dissenya i gestiona les Situacions d&apos;Aprenentatge (LOMLOE).
                        </p>
                    </div>

                    <Link
                        href="/academy/manage/create"
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} />
                        Nova S.A.
                    </Link>
                </div>

                {/* Content Placeholder (List of Created SAs) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                    <p className="mb-4">
                        Aquesta àrea mostrarà la llista de Situacions d&apos;Aprenentatge que hagis creat.
                    </p>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-50">
                        Work In Progress
                    </p>
                </div>
            </div>
        </div>
    );
}
