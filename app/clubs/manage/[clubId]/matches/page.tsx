'use client';

import { Trophy } from 'lucide-react';

export default function ClubMatchesPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Competicions</h1>
                    <p className="text-neutral-400 mt-2">Organització de competicions internes i interclubs.</p>
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
                    <Trophy className="w-4 h-4 mr-2" />
                    CREAR MATX
                </button>
            </div>

            <div className="mt-8 text-center py-16 border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="text-neutral-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No hi ha competicions actives</h3>
                <p className="text-neutral-400 max-w-md mx-auto mb-6">
                    Comença creant la primera competició del teu club. Pots organitzar lligues, tornejos suïssos o matxos amistosos.
                </p>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Crear la meva primera competició
                </button>
            </div>
        </div>
    );
}
