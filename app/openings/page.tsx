'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ChevronRight, X, Play, Copy, RefreshCw, Library } from 'lucide-react';
import { Chess } from 'chess.js';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { toast } from 'sonner';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Panel } from '@/components/ui/design-system/Panel';
import { Button } from '@/components/ui/button';

interface Opening {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
}

const TABS = ['A', 'B', 'C', 'D', 'E'];

export default function OpeningsPage() {
    const [activeTab, setActiveTab] = useState('A');
    const [searchQuery, setSearchQuery] = useState('');
    const [openings, setOpenings] = useState<Opening[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const LIMIT = 50;

    const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);

    // Fetch Openings
    useEffect(() => {
        const fetchOpenings = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('academy_concepts')
                    .select('*', { count: 'exact' })
                    .eq('category', 'OPENING');

                if (searchQuery) {
                    query = query.ilike('display_name', `%${searchQuery}%`);
                } else {
                    query = query.ilike('display_name', `${activeTab}%`);
                }

                const { data, error, count } = await query
                    .range(page * LIMIT, (page + 1) * LIMIT - 1)
                    .order('display_name', { ascending: true });

                if (error) throw error;

                if (page === 0) {
                    setOpenings(data || []);
                } else {
                    setOpenings(prev => [...prev, ...(data || [])]);
                }
                setTotalCount(count || 0);

            } catch (err) {
                console.error('Error fetching openings:', err);
                toast.error('Failed to load openings');
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchOpenings, 300);
        return () => clearTimeout(timeout);

    }, [activeTab, searchQuery, page]);

    useEffect(() => {
        setPage(0);
        setOpenings([]);
    }, [activeTab, searchQuery]);

    const handleLoadMore = () => {
        setPage(p => p + 1);
    };

    return (
        <div className="h-full w-full p-6 pb-24 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <Panel className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 p-6 bg-zinc-900/90 border-zinc-700">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Library className="text-amber-500" size={32} />
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 uppercase tracking-tight font-display drop-shadow-sm text-stroke">
                            Encyclopedia
                        </h1>
                    </div>

                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest ml-1">
                        The complete library of chess openings (ECO A-E).
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search openings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600 font-bold shadow-inner"
                    />
                </div>
            </Panel>

            {/* Encyclopedia Tabs */}
            {!searchQuery && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                relative px-8 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all
                                flex flex-col items-center gap-1 min-w-[100px] justify-center group
                                border-b-4 active:border-b-0 active:translate-y-1
                                ${activeTab === tab
                                    ? 'bg-amber-500 text-black border-amber-700 shadow-[0_4px_20px_rgba(245,158,11,0.4)]'
                                    : 'bg-zinc-800 border-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}
                            `}
                        >
                            <span className="text-[10px] opacity-60">Volume</span>
                            <span className="text-2xl font-display italic">{tab}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Openings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {openings.map((opening) => (
                    <motion.div
                        key={opening.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedOpening(opening)}
                    >
                        <GameCard variant="default" className="cursor-pointer h-full hover:border-amber-500/50 transition-all group relative overflow-hidden bg-zinc-900/60 p-4 border-zinc-800">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-10 transition-opacity transform group-hover:rotate-12">
                                <BookOpen size={64} />
                            </div>

                            <div className="flex items-start justify-between mb-3 relative z-10">
                                <span className="px-2 py-1 rounded bg-black/60 text-[10px] font-bold text-amber-500 uppercase tracking-widest border border-zinc-700/50 shadow-sm">
                                    {opening.display_name.split(':')[0]}
                                </span>
                            </div>

                            <h3 className="text-sm font-black text-zinc-200 leading-tight mb-2 pr-8 truncate font-display tracking-wide group-hover:text-amber-400 transition-colors relative z-10">
                                {opening.display_name.split(':')[1]?.trim() || opening.display_name}
                            </h3>
                            <div className="text-[10px] text-zinc-500 font-mono truncate bg-black/20 p-1.5 rounded relative z-10 border border-white/5">
                                {extractMoves(opening.description).substring(0, 30) || 'Moves not available'}...
                            </div>

                            <div className="mt-4 flex items-center justify-end text-[10px] font-bold text-zinc-600 gap-1 uppercase tracking-wide group-hover:text-emerald-400 transition-colors">
                                Analyze <ChevronRight size={12} />
                            </div>
                        </GameCard>
                    </motion.div>
                ))}
            </div>

            {/* Load More */}
            {openings.length < totalCount && (
                <div className="flex justify-center mt-8">
                    <ShinyButton
                        onClick={handleLoadMore}
                        disabled={loading}
                        variant="neutral"
                        className="px-8"
                    >
                        {loading ? <RefreshCw className="animate-spin mr-2" size={14} /> : null}
                        Load More Openings
                    </ShinyButton>
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedOpening && (
                    <OpeningDetailModal
                        opening={selectedOpening}
                        onClose={() => setSelectedOpening(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Extraction Helper
function extractMoves(description: string): string {
    if (!description) return '';
    const match = description.match(/\*\*Moves:\*\*\s*(.*)/);
    return match ? match[1] : '';
}

function OpeningDetailModal({ opening, onClose }: { opening: Opening, onClose: () => void }) {
    const { pgn, fen } = useMemo(() => {
        const moves = extractMoves(opening.description);
        let calculatedFen = 'start';
        try {
            const game = new Chess();
            game.loadPgn(moves);
            calculatedFen = game.fen();
        } catch (e) {
            console.error('Invalid PGN', e);
        }
        return { pgn: moves, fen: calculatedFen };
    }, [opening]);

    const handleCopy = () => {
        navigator.clipboard.writeText(pgn);
        toast.success('PGN copied to clipboard');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-zinc-400 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                    <X size={20} />
                </button>

                {/* Left: Board */}
                <div className="w-full md:w-1/2 bg-zinc-900/50 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-zinc-800 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
                    <div className="w-full max-w-[400px] aspect-square shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden border-[8px] border-zinc-800 ring-1 ring-white/10 relative z-10">
                        <Chessboard2D
                            fen={fen}
                            onSquareClick={() => { }}
                            orientation="white"
                        />
                    </div>
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto bg-zinc-950">
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-wider mb-3">
                            {opening.display_name.split(':')[0]}
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight font-display mb-2">
                            {opening.display_name.split(':')[1]?.trim() || opening.display_name}
                        </h2>
                        <div className="text-zinc-500 text-sm font-bold uppercase tracking-wide">
                            {opening.display_name.includes(',')
                                ? opening.display_name.split(',').slice(1).join(',')
                                : 'Main Line'}
                        </div>
                    </div>

                    {/* Moves */}
                    <GameCard variant="default" className="bg-zinc-900/50 rounded-xl p-4 border-zinc-800 mb-6 font-mono text-sm text-zinc-300 leading-relaxed max-h-48 overflow-y-auto scrollbar-thin shadow-inner">
                        {pgn || <span className="text-zinc-600 italic">No moves recorded.</span>}
                    </GameCard>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="h-12 border-zinc-700 hover:bg-zinc-800 hover:text-white uppercase tracking-wider font-bold text-xs gap-2"
                        >
                            <Copy size={16} /> Copy PGN
                        </Button>
                        <ShinyButton
                            variant="primary"
                            className="h-12 text-xs uppercase tracking-wider"
                        >
                            <Play size={16} className="mr-2" /> Practice
                        </ShinyButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
