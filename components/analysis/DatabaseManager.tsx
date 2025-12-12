'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, FolderPlus, Map, Calendar, MoreVertical, PlayCircle, Import, FileText, Trash, Upload, X, Save } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { formatDistanceToNow } from 'date-fns';
import { ca } from 'date-fns/locale';

interface DatabaseManagerProps {
    onLoadGame: (pgn: string) => void;
    currentPgn?: string; // If provided, shows "Save" option
}

interface PGNCollection {
    id: string;
    title: string;
    description: string;
    count?: number; // Fetched from count
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

export const DatabaseManager = ({ onLoadGame, currentPgn }: DatabaseManagerProps) => {
    const [collections, setCollections] = useState<PGNCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [games, setGames] = useState<PGNGame[]>([]);

    // Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    // Import Modal
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [targetCollection, setTargetCollection] = useState<string>('');

    // Save Modal
    const [isSaveOpen, setIsSaveOpen] = useState(false);

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        if (selectedCollection) {
            fetchGames(selectedCollection);
        }
    }, [selectedCollection]);

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

        const { error } = await supabase.from('pgn_games').insert({
            collection_id: targetCollection,
            pgn: pgnContent,
            white: extractTag(pgnContent, 'White') || 'Unknown',
            black: extractTag(pgnContent, 'Black') || 'Unknown',
            event: extractTag(pgnContent, 'Event') || 'Imported Game',
            date: extractTag(pgnContent, 'Date') || new Date().toISOString().split('T')[0],
            result: extractTag(pgnContent, 'Result') || '*',
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

        const { error } = await supabase.from('pgn_games').insert({
            collection_id: targetCollection,
            pgn: currentPgn,
            white: extractTag(currentPgn, 'White') || 'Unknown',
            black: extractTag(currentPgn, 'Black') || 'Unknown',
            event: extractTag(currentPgn, 'Event') || 'Analysis Game',
            date: extractTag(currentPgn, 'Date') || new Date().toISOString().split('T')[0],
            result: extractTag(currentPgn, 'Result') || '*',
        });

        if (!error) {
            setIsSaveOpen(false);
            if (selectedCollection === targetCollection) fetchGames(selectedCollection);
            fetchCollections();
        }
    };

    const extractTag = (pgn: string, tag: string) => {
        const match = pgn.match(new RegExp(`\\[${tag}\\s+"(.*?)"\\]`));
        return match ? match[1] : null;
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">

            {/* HEADER */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 sticky top-0 z-10 gap-2">
                {selectedCollection ? (
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCollection(null)} className="shrink-0 text-zinc-400 hover:text-white">
                            <span className="sr-only">Back</span>
                            ←
                        </Button>
                        <h2 className="font-bold truncate text-sm">{collections.find(c => c.id === selectedCollection)?.title}</h2>
                    </div>
                ) : (
                    <h2 className="font-bold text-lg flex-1">Bases</h2>
                )}

                <div className="flex gap-1 shrink-0">

                    {/* SAVE BUTTON - Only show if currentPgn is available */}
                    {currentPgn && (
                        <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 border border-emerald-600/50" title="Guardar a la base de dades">
                                    <Save size={16} />
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
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Crear Base de Dades"><FolderPlus size={16} /></Button>
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
                            <Button size="sm" variant="default" className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-500" title="Importar PGN"><Import size={16} /></Button>
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
                                    <div className="space-y-1 overflow-hidden cursor-pointer flex-1" onClick={() => onLoadGame(game.pgn)}>
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
                                        <Button size="sm" variant="ghost" onClick={() => onLoadGame(game.pgn)} className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800">
                                            <PlayCircle size={18} />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-zinc-800">
                                            <Trash size={16} />
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

        </div>
    );
}
