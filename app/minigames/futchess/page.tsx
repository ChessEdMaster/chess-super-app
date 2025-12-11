'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';

export default function FutChessPage() {
    return (
        <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
            <Link href="/minigames" className="absolute top-8 left-8">
                <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    <ArrowLeft className="mr-2" /> Tornar
                </Button>
            </Link>

            <div className="text-center max-w-lg">
                <div className="bg-emerald-500/10 p-6 rounded-full inline-block mb-6">
                    <Construction size={64} className="text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black mb-4">FUTCHESS</h1>
                <p className="text-xl text-zinc-400 mb-8">
                    El camp de joc s'està construint.
                    <br />
                    Aviat podràs marcar gols capturant el rei rival!
                </p>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left text-sm text-zinc-500 space-y-2">
                    <p><strong>Concepte:</strong> Escacs en un tauler amb porteries.</p>
                    <p><strong>Objectiu:</strong> Portar la pilota (peça especial) a la meta contrària.</p>
                    <p><strong>Mecànica:</strong> Passes, xuts i captures estratègiques.</p>
                </div>
            </div>
        </div>
    );
}
