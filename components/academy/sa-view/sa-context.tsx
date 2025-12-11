import React from 'react';
import { MapPin, Box, Fingerprint } from 'lucide-react';
import { AcademyModule } from '@/types/academy';

interface SAContextProps {
    module: AcademyModule;
}

export function SAContext({ module }: SAContextProps) {
    if (!module.context_description && !module.final_product) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Context Card */}
            {module.context_description && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                            <MapPin size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Context (Narrativa)</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        {module.context_description}
                    </p>
                </div>
            )}

            {/* Final Product Card */}
            {module.final_product && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
                            <Box size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Producte Final</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-medium">
                        {module.final_product}
                    </p>
                </div>
            )}
        </div>
    );
}
