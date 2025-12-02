'use client';

import React, { useState, useEffect } from 'react';
import { Users, Trophy } from 'lucide-react';

interface ExplorerMove {
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
    averageRating: number;
}

interface OpeningExplorerProps {
    fen: string;
    onSelectMove: (uci: string) => void;
}

export function OpeningExplorer({ fen, onSelectMove }: OpeningExplorerProps) {
    const [moves, setMoves] = useState<ExplorerMove[]>([]);
    const [loading, setLoading] = useState(false);
    const [dbSource, setDbSource] = useState<'masters' | 'lichess'>('masters');

    useEffect(() => {
        const fetchOpeningData = async () => {
            setLoading(true);
            try {
                // Convertim la FEN per ser compatible amb URL
                const cleanFen = fen.replace(/\s+/g, '_');
                // Lichess API endpoint
                const response = await fetch(`https://explorer.lichess.ovh/${dbSource}?fen=${cleanFen}&moves=10`);
                const data = await response.json();
                setMoves(data.moves || []);
            } catch (error) {
                console.error("Error fetching opening data", error);
                setMoves([]);
            } finally {
                setLoading(false);
            }
        };

        if (fen) fetchOpeningData();
    }, [fen, dbSource]);

    const getTotalGames = (m: ExplorerMove) => m.white + m.draws + m.black;

    return (
        <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Selector de Base de Dades */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setDbSource('masters')}
                    className={`flex-1 p-3 text-xs font-bold flex items-center justify-center gap-2 ${dbSource === 'masters' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <Trophy size={14} /> Mestres
                </button>
                <button
                    onClick={() => setDbSource('lichess')}
                    className={`flex-1 p-3 text-xs font-bold flex items-center justify-center gap-2 ${dbSource === 'lichess' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <Users size={14} /> Lichess
                </button>
            </div>

            {/* Taula de Moviments */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-800 uppercase">
                        <tr>
                            <th className="px-3 py-2">Mov</th>
                            <th className="px-3 py-2 text-center">Partides</th>
                            <th className="px-3 py-2 text-right">Win Rate</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-300">
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Carregant dades...</td></tr>
                        ) : moves.map((move) => {
                            const total = getTotalGames(move);
                            const whitePct = Math.round((move.white / total) * 100);
                            const drawPct = Math.round((move.draws / total) * 100);
                            const blackPct = Math.round((move.black / total) * 100);

                            return (
                                <tr key={move.uci}
                                    onClick={() => onSelectMove(move.uci)}
                                    className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition"
                                >
                                    <td className="px-3 py-2 font-bold text-white">{move.san}</td>
                                    <td className="px-3 py-2 text-center text-xs">{total.toLocaleString()}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex h-2 rounded-full overflow-hidden w-full min-w-[60px] bg-slate-700">
                                            <div style={{ width: `${whitePct}%` }} className="bg-gray-200" title={`Blanques: ${whitePct}%`} />
                                            <div style={{ width: `${drawPct}%` }} className="bg-gray-500" title={`Taules: ${drawPct}%`} />
                                            <div style={{ width: `${blackPct}%` }} className="bg-gray-800" title={`Negres: ${blackPct}%`} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {moves.length === 0 && !loading && (
                    <div className="p-6 text-center text-slate-500 text-xs">
                        No s&apos;han trobat partides en aquesta posició a la base de dades.
                    </div>
                )}
            </div>
        </div>
    );
}
