'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Trash2,
    Calendar,
    PlayCircle,
    PlusCircle,
    Import,
    Edit,
    FolderOpen,
    ChevronLeft,
    Database,
    MoreVertical,
    Check
} from 'lucide-react';
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

type View = 'collections' | 'games';

export function DatabasePanel({ currentCollectionId: propCollectionId, activeGameId, onLoadGame, onNewAnalysis }: DatabasePanelProps) {
    const [view, setView] = useState<View>(propCollectionId ? 'games' : 'collections');
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(propCollectionId);

    // Data State
    const [collections, setCollections] = useState<any[]>([]);
    const [games, setGames] = useState<any[]>([]);
    const [currentCollection, setCurrentCollection] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Dialogs & Inputs
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<any>(null);
    const [isCreateColOpen, setIsCreateColOpen] = useState(false);
    const [newColTitle, setNewColTitle] = useState('');

    // --- Data Fetching ---

    const fetchCollections = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('pgn_collections')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setCollections(data || []);
        } catch (e: any) {
            console.error('Error fetching collections:', e);
            toast.error('Error carregant BBDD: ' + e.message);
        }
    }, []);

    const fetchGames = useCallback(async (colId: string) => {
        try {
            const { data, error } = await supabase
                .from('pgn_games')
                .select('*')
                .eq('collection_id', colId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGames(data || []);
        } catch (e: any) {
            console.error('Error fetching games:', e);
            toast.error('Error carregant partides: ' + e.message);
        }
    }, []);

    // --- Lifecycle & Realtime ---

    useEffect(() => {
        // Initial fetch
        fetchCollections();

        // Listen for auth changes to re-fetch
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchCollections();
                if (selectedCollectionId) fetchGames(selectedCollectionId);
            }
        });

        // Subscription for Collections (Realtime)
        const colChannel = supabase
            .channel('public:pgn_collections')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pgn_collections' }, () => {
                fetchCollections();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(colChannel);
            authListener?.unsubscribe();
        };
    }, [fetchCollections, fetchGames, selectedCollectionId]);

    useEffect(() => {
        if (selectedCollectionId) {
            fetchGames(selectedCollectionId);
            const col = collections.find(c => c.id === selectedCollectionId);
            if (col) setCurrentCollection(col);
            else {
                // Fetch col details if not in list
                supabase.from('pgn_collections').select('*').eq('id', selectedCollectionId).single()
                    .then(({ data }) => setCurrentCollection(data));
            }

            // Subscription for Games in THIS collection
            const gameChannel = supabase
                .channel(`public:pgn_games:col:${selectedCollectionId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'pgn_games',
                    filter: `collection_id=eq.${selectedCollectionId}`
                }, () => {
                    fetchGames(selectedCollectionId);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(gameChannel);
            };
        }
    }, [selectedCollectionId, fetchGames, collections]);

    useEffect(() => {
        setLoading(false);
    }, [collections, games]);

    // Sync with external collection changes (e.g. from Setup)
    useEffect(() => {
        if (propCollectionId) {
            setSelectedCollectionId(propCollectionId);
            setView('games');
        }
    }, [propCollectionId]);

    // --- Actions ---

    const handleCreateCollection = async () => {
        if (!newColTitle.trim()) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('pgn_collections').insert({
                title: newColTitle,
                user_id: user.id
            });

            if (error) throw error;
            toast.success('BBDD creada');
            setIsCreateColOpen(false);
            setNewColTitle('');
        } catch (e: any) {
            toast.error('Error: ' + e.message);
        }
    };

    const handleImport = async () => {
        if (!importText.trim() || !selectedCollectionId) return;
        try {
            const tree = PGNParser.parse(importText);
            const metadata = tree.getGame().metadata;

            const { error } = await supabase.from('pgn_games').insert({
                collection_id: selectedCollectionId,
                pgn: importText,
                white: metadata.white || 'Unknown',
                black: metadata.black || 'Unknown',
                event: metadata.event || 'Imported Game',
                date: metadata.date || new Date().toISOString().split('T')[0],
                result: metadata.result || '*',
            });

            if (error) throw error;
            setIsImportOpen(false);
            setImportText('');
            toast.success('Partida importada');
        } catch (e: any) {
            toast.error('Error: ' + e.message);
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
            setIsEditOpen(false);
            toast.success('Dades actualitzades');
        } catch (e: any) {
            toast.error('Error al guardar');
        }
    };

    const handleDeleteGame = async (id: string) => {
        if (!confirm('Segur?')) return;
        const { error } = await supabase.from('pgn_games').delete().eq('id', id);
        if (error) toast.error('Error al eliminar');
        else toast.success('Eliminat');
    };

    // --- Renderers ---

    const renderCollections = () => (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            <div className="grid grid-cols-1 gap-2">
                {collections.map(col => (
                    <div
                        key={col.id}
                        onClick={() => {
                            setSelectedCollectionId(col.id);
                            setView('games');
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all group ${propCollectionId === col.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-indigo-500'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-md ${propCollectionId === col.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                    <Database size={16} />
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-sm font-bold text-[var(--foreground)] truncate">{col.title}</span>
                                    <span className="text-[10px] text-[var(--color-secondary)]">Últim canvi: {formatDistanceToNow(new Date(col.updated_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                            {propCollectionId === col.id && <Check size={14} className="text-emerald-500" />}
                        </div>
                    </div>
                ))}
                {collections.length === 0 && !loading && (
                    <div className="text-center py-12 text-zinc-600 italic text-xs">No tens cap base de dades</div>
                )}
            </div>
        </div>
    );

    const renderGames = () => (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {games.map(game => (
                <div
                    key={game.id}
                    className={`group bg-[var(--card-bg)] border rounded-lg p-2 transition-all ${activeGameId === game.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:border-indigo-500'}`}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col overflow-hidden cursor-pointer flex-1" onClick={() => onLoadGame(game.id)}>
                            <div className="flex items-center gap-2">
                                {activeGameId === game.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                <span className="text-[11px] font-bold text-[var(--foreground)] truncate">
                                    {game.white} vs {game.black}
                                </span>
                            </div>
                            <span className="text-[10px] text-[var(--color-secondary)] truncate">
                                {game.event || 'Analysis Session'} • {game.date}
                            </span>
                        </div>
                        <div className="flex items-center gap-0.5 ml-2">
                            <Button
                                variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-indigo-400"
                                onClick={() => { setEditingGame({ ...game }); setIsEditOpen(true); }}
                            >
                                <Edit size={12} />
                            </Button>
                            <Button
                                variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-rose-500"
                                onClick={() => handleDeleteGame(game.id)}
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-[var(--border)]/50">
                        <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                            {game.result || '*'}
                        </span>
                        {activeGameId !== game.id && (
                            <button onClick={() => onLoadGame(game.id)} className="text-indigo-400 hover:underline text-[9px] font-bold">
                                CARREGAR
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {games.length === 0 && !loading && (
                <div className="text-center py-12 text-zinc-600 italic text-xs">Aquesta BBDD està buida</div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[var(--panel-bg)]/50 rounded-xl overflow-hidden border border-[var(--border)]">
            {/* Header / Breadcrumbs */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--header-bg)] flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    {view === 'games' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setView('collections')}>
                            <ChevronLeft size={16} />
                        </Button>
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                            {view === 'collections' ? 'Bibliodades' : currentCollection?.title}
                        </h3>
                        <span className="text-xs font-bold text-[var(--foreground)] truncate">
                            {view === 'collections' ? 'Les meves BBDD' : 'Partides guardades'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-1">
                    {view === 'collections' ? (
                        <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-indigo-400"
                            onClick={() => setIsCreateColOpen(true)}
                        >
                            <PlusCircle size={18} />
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-emerald-500"
                                onClick={onNewAnalysis} title="Nova Anàlisi"
                            >
                                <PlusCircle size={18} />
                            </Button>
                            <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-indigo-400"
                                onClick={() => setIsImportOpen(true)} title="Importar PGN"
                            >
                                <Import size={18} />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            {view === 'collections' ? renderCollections() : renderGames()}

            {/* Dialogs */}
            <Dialog open={isCreateColOpen} onOpenChange={setIsCreateColOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nova Base de Dades</DialogTitle></DialogHeader>
                    <div className="py-4"><Input placeholder="Títol de la BBDD..." value={newColTitle} onChange={e => setNewColTitle(e.target.value)} /></div>
                    <DialogFooter><Button onClick={handleCreateCollection} disabled={!newColTitle.trim()}>Crear</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Importar PGN</DialogTitle></DialogHeader>
                    <div className="py-4 font-mono">
                        <textarea
                            className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded p-3 text-xs"
                            placeholder="Past PGN..." value={importText} onChange={e => setImportText(e.target.value)}
                        />
                    </div>
                    <DialogFooter><Button onClick={handleImport} disabled={!importText.trim()}>Importar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar jugadors / dades</DialogTitle></DialogHeader>
                    {editingGame && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-1"><Label>Blanc</Label><Input value={editingGame.white} onChange={e => setEditingGame({ ...editingGame, white: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Negre</Label><Input value={editingGame.black} onChange={e => setEditingGame({ ...editingGame, black: e.target.value })} /></div>
                            <div className="col-span-2 space-y-1"><Label>Esdeveniment</Label><Input value={editingGame.event} onChange={e => setEditingGame({ ...editingGame, event: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Data</Label><Input type="date" value={editingGame.date} onChange={e => setEditingGame({ ...editingGame, date: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Resultat</Label><Input value={editingGame.result} onChange={e => setEditingGame({ ...editingGame, result: e.target.value })} /></div>
                        </div>
                    )}
                    <DialogFooter><Button onClick={handleUpdateMetadata}>Actualitzar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
