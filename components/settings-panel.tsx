'use client';

import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Palette, X } from 'lucide-react';
import { useSettings, BoardTheme } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

export function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const { soundEnabled, boardTheme, toggleSound, setBoardTheme } = useSettings();

    return (
        <>
            {/* Settings Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-800 transition text-slate-400 hover:text-white"
                title="Configuració"
            >
                <Settings size={20} />
            </button>

            {/* Settings Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Settings size={24} className="text-indigo-400" />
                                Configuració
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-800 transition text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Sound Settings */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                Sons
                            </h3>
                            <button
                                onClick={toggleSound}
                                className={`w-full p-4 rounded-xl border-2 transition flex items-center justify-between ${soundEnabled
                                        ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}
                            >
                                <span className="font-medium">
                                    {soundEnabled ? 'Sons activats' : 'Sons desactivats'}
                                </span>
                                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                        </div>

                        {/* Board Theme Settings */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Palette size={16} />
                                Tema del Tauler
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(BOARD_THEMES).map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => setBoardTheme(key as BoardTheme)}
                                        className={`p-4 rounded-xl border-2 transition ${boardTheme === key
                                                ? 'bg-indigo-900/20 border-indigo-500/50'
                                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex gap-2 mb-2">
                                            <div
                                                className="w-8 h-8 rounded border border-slate-600"
                                                style={{ backgroundColor: theme.light }}
                                            />
                                            <div
                                                className="w-8 h-8 rounded border border-slate-600"
                                                style={{ backgroundColor: theme.dark }}
                                            />
                                        </div>
                                        <p className={`text-sm font-medium ${boardTheme === key ? 'text-indigo-300' : 'text-slate-300'}`}>
                                            {theme.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition"
                        >
                            Tancar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
