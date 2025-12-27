'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Calendar, PlayCircle, PlusCircle, Import, Edit, FolderOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PGNParser } from '@/lib/pgn/parser';

interface DatabasePanelProps {
    currentCollectionId: string | null;
    activeGameId: string | null;
    onLoadGame: (id: string) => void;
    onNewAnalysis: () => void;
}

export function DatabasePanel({ currentCollectionId, activeGameId, onLoadGame, onNewAnalysis }: DatabasePanelProps) {
    const [games, setGames] = useState<any[]>([]);
    const [collection, setCollection] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Import State
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');

    // Metadata Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<any>(null);

    useEffect(() => {
        if (currentCollectionId) {
            fetchCollectionData();
        } else {
            setLoading(false);
        }
    }, [currentCollectionId]);

    const fetchCollectionData = async () => {
        setLoading(true);
        try {
            // Fetch collection title
            const { data: colData } = await supabase
                .from('pgn_collections')
                .select('*')
                .eq('id', currentCollectionId)
                .single();
            setCollection(colData);

            // Fetch games
            const { data: gamesData, error } = await supabase
                .from('pgn_games')
                .select('*')
                .eq('collection_id', currentCollectionId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setGames(gamesData || []);
        } catch (e: any) {
            console.error('Error fetching collection data:', e);
            toast.error('Error al carregar la base de dades');
        } finally {
            setLoading(false);
        }
    };

    const deleteGame = async (id: string) => {
        if (!confirm('Segur que vols eliminar aquesta anàlisi?')) return;
        try {
            const { error } = await supabase.from('pgn_games').delete().eq('id', id);
            if (error) throw error;
            setGames(prev => prev.filter(g => g.id !== id));
            toast.success('Anàlisi eliminada');
        } catch (e: any) {
            toast.error('Error al eliminar');
        }
    };

    const handleImport = async () => {
        if (!importText.trim() || !currentCollectionId) return;
        try {
            const tree = PGNParser.parse(importText);
            const metadata = tree.getGame().metadata;

            const { data: gameData, error } = await supabase.from('pgn_games').insert({
                collection_id: currentCollectionId,
                pgn: importText,
                white: metadata.white || 'Unknown',
                black: metadata.black || 'Unknown',
                event: metadata.event || 'Imported Game',
                date: metadata.date || new Date().toISOString().split('T')[0],
                result: metadata.result || '*',
            }).select().single();

            if (error) throw error;

            setGames([gameData, ...games]);
            setIsImportOpen(false);
            setImportText('');
            toast.success('Partida importada correctament');
        } catch (e: any) {
            toast.error('Error en importar: ' + e.message);
        }
    };

    const handleUpdateMetadata = async () => {
        if (!editingGame) return;
        try {
            const { error } = await supabase
                .from('pgn_games')
                .update({
                    white: editingGame.white,
                    black: editingGame.black,
                    event: editingGame.event,
                    date: editingGame.date,
                    result: editingGame.result
                })
                .eq('id', editingGame.id);

            if (error) throw error;

            setGames(prev => prev.map(g => g.id === editingGame.id ? { ...g, ...editingGame } : g));
            setIsEditOpen(false);
            toast.success('Dades actualitzades');
        } catch (e: any) {
            toast.error('Error al guardar canvis');
        }
    };

    if (!currentCollectionId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 gap-4">
                <FolderOpen size={48} className="opacity-20" />
                <p className="text-sm italic">Inicia una sessió d'anàlisi o selecciona una base de dades per veure el seu contingut.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[var(--panel-bg)]/50 rounded-xl overflow-hidden border border-[var(--border)]">
            <div className="p-3 border-b border-[var(--border)] bg-[var(--header-bg)] flex items-center justify-between">
                <div className="flex flex-col overflow-hidden">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Base de Dades</h3>
                    <span className="text-xs font-bold text-[var(--foreground)] truncate">{collection?.title || 'Carregant...'}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={onNewAnalysis} title="Nova Anàlisi">
                        <PlusCircle size={18} />
                    </Button>
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400" title="Importar PGN">
                                <Import size={18} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Importar PGN a {collection?.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Textarea
                                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono"
                                    placeholder="Enganxa el PGN aquí..."
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleImport} disabled={!importText.trim()}>Importar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
                {loading ? (
                    <div className="p-8 text-center text-[var(--color-secondary)] text-xs animate-pulse">
                        Carregant partides...
                    </div>
                ) : (
                    <>
                        {games.map(game => (
                            <div
                                key={game.id}
                                className={`group bg-[var(--card-bg)] border rounded-lg p-2 transition-all ${activeGameId === game.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:border-indigo-500'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-col overflow-hidden cursor-pointer" onClick={() => onLoadGame(game.id)}>
                                        <div className="flex items-center gap-2">
                                            {activeGameId === game.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                            <span className="text-[11px] font-bold text-[var(--foreground)] truncate">
                                                {game.white} vs {game.black}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-[var(--color-secondary)] truncate">
                                            {game.event || 'Analysis Session'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-zinc-500 hover:text-indigo-400"
                                            onClick={() => {
                                                setEditingGame({ ...game });
                                                setIsEditOpen(true);
                                            }}
                                        >
                                            <Edit size={12} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-zinc-500 hover:text-red-500"
                                            onClick={() => deleteGame(game.id)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-[var(--border)]/50">
                                    <span className="text-[9px] text-[var(--color-secondary)] flex items-center gap-1">
                                        <Calendar size={10} />
                                        {formatDistanceToNow(new Date(game.updated_at || game.created_at), { addSuffix: true })}
                                    </span>
                                    {activeGameId !== game.id && (
                                        <button
                                            onClick={() => onLoadGame(game.id)}
                                            className="text-indigo-400 hover:underline text-[9px] font-bold flex items-center gap-1"
                                        >
                                            <PlayCircle size={10} /> CARREGAR
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {games.length === 0 && (
                            <div className="p-8 text-center text-[var(--color-secondary)] text-xs italic">
                                No s'han trobat partides en aquesta col·lecció.
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Metadata Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar dades de la partida</DialogTitle>
                    </DialogHeader>
                    {editingGame && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Blanc</Label>
                                <Input value={editingGame.white} onChange={e => setEditingGame({ ...editingGame, white: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Negre</Label>
                                <Input value={editingGame.black} onChange={e => setEditingGame({ ...editingGame, black: e.target.value })} />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Esdeveniment</Label>
                                <Input value={editingGame.event} onChange={e => setEditingGame({ ...editingGame, event: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input type="date" value={editingGame.date} onChange={e => setEditingGame({ ...editingGame, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Resultat</Label>
                                <Input value={editingGame.result} onChange={e => setEditingGame({ ...editingGame, result: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleUpdateMetadata}>Guardar canvis</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper component for textarea if not available
function Textarea(props: any) {
    return <textarea {...props} />;
}
