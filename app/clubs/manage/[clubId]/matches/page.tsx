'use client';

import { Trophy } from 'lucide-react';

export default function ClubMatchesPage() {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Competicions i Torneigs</h2>
            <p className="text-neutral-400">Organització de competicions internes i interclubs.</p>

            <div className="mt-8 text-center py-12 border-2 border-dashed border-neutral-800 rounded-xl">
                <Trophy className="mx-auto text-neutral-600 mb-4" size={48} />
                <p className="text-neutral-500">Gestor de competicions en construcció...</p>
                <p className="text-sm text-neutral-600 mt-2">Aviat podràs crear lligues, suïssos i eliminatòries.</p>
            </div>
        </div>
    );
}
