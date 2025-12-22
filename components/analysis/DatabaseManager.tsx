'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FolderPlus, PlayCircle, Import, Trash, Save, Pickaxe, Tv } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import { minePuzzles, getLichessTV } from '@/app/actions/lichess-actions';
import { PGNParser } from '@/lib/pgn/parser';
import { toast } from 'sonner';

interface DatabaseManagerProps {
    onLoadGame: (pgn: string, id?: string) => void;
    currentPgn?: string;
}

interface PGNCollection {
    id: string;
    title: string;
    description: string;
    count?: number;
    created_at: string;
}

interface PGNGame {
    id: string;
    white: string;
    black: string;
    result: string;
    date: string;
    pgn: string;
    event: string;
}

interface Concept {
    name: string;
    display_name: string;
    puzzle_count: number;
}

export const DatabaseManager = ({ onLoadGame, currentPgn }: DatabaseManagerProps) => {
    // --- MAIN TABS ---
    const [mainTab, setMainTab] = useState<'library' | 'mining' | 'tv'>('library');

    // --- LIBRARY STATE ---
    const [collections, setCollections] = useState<PGNCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [games, setGames] = useState<PGNGame[]>([]);

    // --- MINING STATE ---
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<string>('');
    const [minRating, setMinRating] = useState(1500);
    const [maxRating, setMaxRating] = useState(2500);
    const [miningLoading, setMiningLoading] = useState(false);
    const [minedPuzzles, setMinedPuzzles] = useState<any[]>([]);

    // --- TV STATE ---
    const [tvGames, setTvGames] = useState<any[]>([]);
    const [tvLoading, setTvLoading] = useState(false);

    // --- MODALS ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [targetCollection, setTargetCollection] = useState<string>('');
    const [isSaveOpen, setIsSaveOpen] = useState(false);

    useEffect(() => {
        if (mainTab === 'library') {
            fetchCollections();
        } else if (mainTab === 'mining') {
            // Load concepts for dropdown
            fetchConcepts();
        } else if (mainTab === 'tv') {
            fetchTV();
        }
    }, [mainTab]);

    useEffect(() => {
        if (selectedCollection) {
            fetchGames(selectedCollection);
        }
    }, [selectedCollection]);

    // --- LIBRARY ACTIONS ---
    const fetchCollections = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('pgn_collections')
            .select('*, pgn_games(count)')
            .order('updated_at', { ascending: false });

        if (!error && data) {
            const formatted = data.map((d: any) => ({
                ...d,
                count: d.pgn_games[0]?.count || 0
            }));
            setCollections(formatted);
        }
        setLoading(false);
    };

    const fetchGames = async (collectionId: string) => {
        const { data, error } = await supabase
            .from('pgn_games')
            .select('*')
            .eq('collection_id', collectionId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setGames(data);
        }
    };

    const createCollection = async () => {
        if (!newTitle.trim()) return;
        const { data, error } = await supabase.from('pgn_collections').insert({
            title: newTitle,
            user_id: (await supabase.auth.getUser()).data.user?.id
        }).select().single();

        if (!error && data) {
            setCollections([data, ...collections]);
            setNewTitle('');
            setIsCreateOpen(false);
        }
    };

    const handleImport = async () => {
        if ((!importText && !importFile) || !targetCollection) return;
        let pgnContent = importText;
        if (importFile) {
            pgnContent = await importFile.text();
        }

        const tree = PGNParser.parse(pgnContent);
        const metadata = tree.getGame().metadata;

        const { error } = await supabase.from('pgn_games').insert({
            collection_id: targetCollection,
            pgn: pgnContent,
            white: metadata.white || 'Unknown',
            black: metadata.black || 'Unknown',
            event: metadata.event || 'Imported Game',
            date: metadata.date || new Date().toISOString().split('T')[0],
            result: metadata.result || '*',
            site: metadata.site || '?',
        });
        if (!error) {
            setIsImportOpen(false);
            setImportText('');
            setImportFile(null);
            if (selectedCollection === targetCollection) fetchGames(selectedCollection);
            fetchCollections();
        }
    };

    const handleSaveGame = async () => {
        if (!currentPgn || !targetCollection) return;

        const tree = PGNParser.parse(currentPgn);
        const metadata = tree.getGame().metadata;

        const { error } = await supabase.from('pgn_games').insert({
            collection_id: targetCollection,
            pgn: currentPgn,
            white: metadata.white || 'Unknown',
            black: metadata.black || 'Unknown',
            event: metadata.event || 'Analysis Game',
            date: metadata.date || new Date().toISOString().split('T')[0],
            result: metadata.result || '*',
            site: metadata.site || '?',
        });
        if (!error) {
            setIsSaveOpen(false);
            if (selectedCollection === targetCollection) fetchGames(selectedCollection);
            fetchCollections();
        }
    };

    // --- MINING ACTIONS ---
    const fetchConcepts = async () => {
        // Fetch top 50 concepts by count for now to avoid massive list
        const { data } = await supabase
            .from('academy_concepts')
            .select('*')
            .order('puzzle_count', { ascending: false })
            .limit(100);
        if (data) setConcepts(data);
    };

    const handleMine = async () => {
        setMiningLoading(true);
        try {
            const { puzzles, error } = await minePuzzles({
                concept: selectedConcept || undefined,
                ratingMin: minRating,
                ratingMax: maxRating,
                limit: 20
            });

            if (error) toast.error("Mining failed: " + error);
            else setMinedPuzzles(puzzles);
        } catch (e) {
            console.error(e);
            toast.error("Failed to mine puzzles");
        } finally {
            setMiningLoading(false);
        }
    };

    // --- TV ACTIONS ---
    const fetchTV = async () => {
        setTvLoading(true);
        try {
            const games = await getLichessTV();
            setTvGames(games);
        } catch (e) {
            console.error(e);
        } finally {
            setTvLoading(false);
        }
    };

    // --- HELPERS ---
    const extractTag = (pgn: string, tag: string) => {
        const match = pgn.match(new RegExp(`\\[${tag}\\s+"(.*?)"\\]`));
        return match ? match[1] : null;
    };

    const formatEvent = (pgn: string) => {
        const event = extractTag(pgn, 'Event') || 'Game';
        return event.replace('Rated', '').trim();
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">

            {/* MAIN HEADER TABS */}
            <div className="flex border-b border-zinc-800 bg-zinc-950">
                <button
                    onClick={() => setMainTab('library')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${mainTab === 'library' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-zinc-800/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Library
                </button>
                <button
                    onClick={() => setMainTab('mining')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${mainTab === 'mining' ? 'text-amber-400 border-b-2 border-amber-500 bg-zinc-800/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Mining
                </button>
                <button
                    onClick={() => setMainTab('tv')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${mainTab === 'tv' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-zinc-800/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    TV & Pro
                </button>
            </div>

            {/* ----- LIBRARY TAB ----- */}
            {mainTab === 'library' && (
                <>
                    {/* TOOLBAR */}
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 sticky top-0 z-10 gap-2">
                        {selectedCollection ? (
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedCollection(null)} className="shrink-0 text-zinc-400 hover:text-white">
                                    <span className="sr-only">Back</span>
                                    ←
                                </Button>
                                <h2 className="font-bold truncate text-sm">{collections.find(c => c.id === selectedCollection)?.title}</h2>
                            </div>
                        ) : (
                            <h2 className="font-bold text-sm text-zinc-400 flex-1 px-2">Your Collections</h2>
                        )}

                        <div className="flex gap-1 shrink-0">
                            {/* SAVE BUTTON - Only show if currentPgn is available */}
                            {currentPgn && (
                                <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 border border-emerald-600/50" title="Guardar a la base de dades">
                                            <Save size={14} />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Guardar Partida</DialogTitle>
                                            <DialogDescription>Guardar la partida actual en una base de dades.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Base de Dades</Label>
                                                <select
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                                                    value={targetCollection}
                                                    onChange={(e) => setTargetCollection(e.target.value)}
                                                >
                                                    <option value="">Selecciona...</option>
                                                    {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleSaveGame} disabled={!targetCollection}>Guardar</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}

                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Crear Base de Dades"><FolderPlus size={14} /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Nova col·lecció</DialogTitle>
                                        <DialogDescription>Crea una nova base de dades per guardar les teves partides.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input placeholder="Títol (ex: Partides del Torneig Obert)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={createCollection}>Crear</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="default" className="h-7 w-7 p-0 bg-indigo-600 hover:bg-indigo-500" title="Importar PGN"><Import size={14} /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Importar PGN</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Col·lecció de destí</Label>
                                            <select
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                                                value={targetCollection}
                                                onChange={(e) => setTargetCollection(e.target.value)}
                                            >
                                                <option value="">Selecciona...</option>
                                                {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>PGN Text</Label>
                                            <textarea
                                                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-white"
                                                placeholder="Paste PGN here..."
                                                value={importText}
                                                onChange={(e) => setImportText(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleImport} disabled={!targetCollection}>Importar</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-zinc-500">Carregant...</div>
                        ) : selectedCollection ? (
                            // GAMES LIST
                            <div className="divide-y divide-zinc-800">
                                {games.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 italic">No hi ha partides en aquesta col·lecció.</div>
                                ) : (
                                    games.map(game => (
                                        <div key={game.id} className="p-3 hover:bg-zinc-800/50 transition group flex items-center justify-between">
                                            <div className="space-y-1 overflow-hidden cursor-pointer flex-1" onClick={() => onLoadGame(game.pgn, game.id)}>
                                                <div className="flex items-center gap-2 font-bold text-sm truncate">
                                                    <span className={game.result === '1-0' ? 'text-emerald-400' : 'text-zinc-300'}>{game.white}</span>
                                                    <span className="text-zinc-600 font-light">vs</span>
                                                    <span className={game.result === '0-1' ? 'text-emerald-400' : 'text-zinc-300'}>{game.black}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">{game.result}</Badge>
                                                    <span className="truncate">{game.event}</span>
                                                    <span>•</span>
                                                    <span>{game.date}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" onClick={() => onLoadGame(game.pgn, game.id)} className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800">
                                                    <PlayCircle size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // COLLECTIONS LIST
                            <div className="grid grid-cols-2 gap-3 p-3">
                                {collections.map(collection => (
                                    <button
                                        key={collection.id}
                                        onClick={() => setSelectedCollection(collection.id)}
                                        className="flex flex-col items-start p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition space-y-2 text-left group"
                                    >
                                        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2 rounded-md group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition">
                                            <FolderPlus className="text-indigo-400" size={20} />
                                        </div>
                                        <div className="w-full">
                                            <div className="font-bold text-sm truncate w-full group-hover:text-indigo-300 transition">{collection.title}</div>
                                            <div className="text-xs text-zinc-500">{collection.count || 0} partides</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ----- MINING TAB ----- */}
            {mainTab === 'mining' && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 space-y-4 bg-zinc-900/50">
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 uppercase tracking-widest">Concept</Label>
                            <select
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                                value={selectedConcept}
                                onChange={(e) => setSelectedConcept(e.target.value)}
                            >
                                <option value="">Any Concept</option>
                                {concepts.map(c => (
                                    <option key={c.name} value={c.name}>{c.display_name} ({c.puzzle_count})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-zinc-500">Min Rating</Label>
                                <Input type="number" value={minRating} onChange={e => setMinRating(parseInt(e.target.value))} className="h-8 bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-zinc-500">Max Rating</Label>
                                <Input type="number" value={maxRating} onChange={e => setMaxRating(parseInt(e.target.value))} className="h-8 bg-zinc-950 border-zinc-800" />
                            </div>
                        </div>
                        <Button className="w-full bg-amber-600 hover:bg-amber-500 text-white" onClick={handleMine} disabled={miningLoading}>
                            {miningLoading ? 'Mining...' : 'Mine Puzzles'} <Pickaxe size={16} className="ml-2" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {minedPuzzles.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 italic text-sm">
                                Configure criteria and click Mine to find puzzles from our 5M+ database.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {minedPuzzles.map((puzzle, i) => (
                                    <div key={i} className="p-3 hover:bg-zinc-800/50 transition flex items-center justify-between group">
                                        <div className="flex-1 cursor-pointer" onClick={() => onLoadGame(puzzle.pgn)}>
                                            <div className="font-bold text-sm text-amber-500">Puzzle #{puzzle.lichess_id}</div>
                                            <div className="text-xs text-zinc-500">Rating: {puzzle.rating} • {puzzle.themes}</div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => onLoadGame(puzzle.pgn)} className="text-amber-500 hover:bg-zinc-800">
                                            <PlayCircle size={18} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ----- TV TAB ----- */}
            {mainTab === 'tv' && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <h2 className="font-bold text-sm text-zinc-400 px-2">Lichess TV</h2>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={fetchTV} disabled={tvLoading}>
                            Refresh
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {tvLoading ? (
                            <div className="p-8 text-center text-zinc-500">Loading live games...</div>
                        ) : tvGames.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 italic text-sm">
                                No live top games found right now.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-800">
                                {tvGames.map((game: any) => (
                                    <div key={game.id} className="p-4 hover:bg-zinc-800/50 transition cursor-pointer group" onClick={() => onLoadGame(game.pgn)}>
                                        <div className="flex justify-between items-center mb-2">
                                            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400 capitalize">{game.variant || 'Standard'} • {game.speed || 'Blitz'}</Badge>
                                            {game.status && <span className="text-[10px] text-emerald-400 animate-pulse font-bold uppercase tracking-wider">Live</span>}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-white/90"></div>
                                                    <span className="font-bold text-sm">{game.user?.name || game.players?.white?.user?.name || 'White'}</span>
                                                    <span className="text-xs text-zinc-500">({game.players?.white?.rating})</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-black/50 border border-zinc-600"></div>
                                                    <span className="font-bold text-sm">{game.user?.name || game.players?.black?.user?.name || 'Black'}</span>
                                                    <span className="text-xs text-zinc-500">({game.players?.black?.rating})</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-emerald-400">
                                            <Tv size={12} /> Watch this game
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
