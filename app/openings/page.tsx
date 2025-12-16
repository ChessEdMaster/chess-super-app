
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ChevronRight, X, Play, Copy, RefreshCw, Filter } from 'lucide-react';
import { Chess } from 'chess.js';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { toast } from 'sonner';

interface Opening {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
    // We expect moves in description or metadata if available
    // But currently we put them in description
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
                    // Filter by Tab (ECO Code)
                    // Assuming display_name starts with ECO code "A00: ..."
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

        // Debounce search
        const timeout = setTimeout(fetchOpenings, 300);
        return () => clearTimeout(timeout);

    }, [activeTab, searchQuery, page]);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(0);
        setOpenings([]);
    }, [activeTab, searchQuery]);

    const handleLoadMore = () => {
        setPage(p => p + 1);
    };

    return (
        <div className="h-full w-full p-4 md:p-8 overflow-y-auto scrollbar-subtle pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 uppercase tracking-tight font-display drop-shadow-sm">
                        Encyclopedia
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2 font-medium">
                        The complete library of chess openings (ECO A-E).
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search openings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Encyclopedia Tabs */}
            {!searchQuery && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                relative px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all
                                flex items-center gap-2 min-w-[100px] justify-center
                                ${activeTab === tab
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}
                            `}
                        >
                            <span className="text-lg opacity-40">Vol.</span>
                            <span className="text-xl">{tab}</span>
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
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(39, 39, 42, 0.8)' }}
                        onClick={() => setSelectedOpening(opening)}
                        className="cursor-pointer bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl hover:border-amber-500/30 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen size={48} />
                        </div>

                        <div className="flex items-start justify-between mb-3">
                            <span className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold text-amber-500 uppercase tracking-widest border border-zinc-700">
                                {opening.display_name.split(':')[0]}
                            </span>
                        </div>

                        <h3 className="text-sm font-bold text-zinc-200 leading-tight mb-1 pr-8 truncate">
                            {opening.display_name.split(':')[1]?.trim() || opening.display_name}
                        </h3>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">
                            {/* Attempt to extract moves snippet from description */}
                            {extractMoves(opening.description).substring(0, 30)}...
                        </div>

                        <div className="mt-4 flex items-center text-[10px] font-bold text-zinc-600 gap-1 uppercase tracking-wide group-hover:text-amber-500/80 transition-colors">
                            Analyze <ChevronRight size={12} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Load More */}
            {openings.length < totalCount && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-8 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs uppercase hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={14} /> : null}
                        Load More Openings
                    </button>
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
    // Description format from seed: **ECO:** A00\n\n**Moves:** 1. e4 ...
    if (!description) return '';
    const match = description.match(/\*\*Moves:\*\*\s*(.*)/);
    return match ? match[1] : '';
}

function OpeningDetailModal({ opening, onClose }: { opening: Opening, onClose: () => void }) {
    const [pgn, setPgn] = useState('');
    const [fen, setFen] = useState('start');

    useEffect(() => {
        const moves = extractMoves(opening.description);
        setPgn(moves);
        try {
            const game = new Chess();
            game.loadPgn(moves);
            setFen(game.fen());
        } catch (e) {
            console.error('Invalid PGN', e);
        }
    }, [opening]);

    const handleCopy = () => {
        navigator.clipboard.writeText(pgn);
        toast.success('PGN copied to clipboard');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-zinc-400 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left: Board */}
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-zinc-900/50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-zinc-800">
                    <div className="w-full max-w-[400px] aspect-square shadow-2xl rounded-lg overflow-hidden border border-zinc-700/50">
                        <Chessboard2D
                            fen={fen}
                            onSquareClick={() => { }}
                            orientation="white"
                        />
                    </div>
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-wider mb-3">
                            {opening.display_name.split(':')[0]}
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight font-display mb-2">
                            {opening.display_name.split(':')[1]?.trim() || opening.display_name}
                        </h2>
                        <div className="text-zinc-500 text-sm font-medium">
                            {opening.display_name.includes(',')
                                ? opening.display_name.split(',').slice(1).join(',')
                                : 'Main Line'}
                        </div>
                    </div>

                    {/* Moves */}
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 mb-6 font-mono text-sm text-zinc-300 leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">
                        {pgn}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                            onClick={handleCopy}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold uppercase tracking-wide text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                            <Copy size={16} /> Copy PGN
                        </button>
                        <button
                            className="bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold uppercase tracking-wide text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-600/20"
                        >
                            <Play size={16} /> Practice
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
