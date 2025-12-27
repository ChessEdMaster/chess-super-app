'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Tag, Layout, ArrowRight, ArrowLeft, Plus, FolderOpen, Save } from 'lucide-react';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { BoardSetup } from './BoardSetup';
import { toast } from 'sonner';

interface SetupWorkflowProps {
    onComplete: (setupData: {
        collectionId: string;
        metadata: Record<string, string>;
        initialFen: string;
    }) => void;
}

export function SetupWorkflow({ onComplete }: SetupWorkflowProps) {
    const [step, setStep] = useState(1);
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [newCollectionTitle, setNewCollectionTitle] = useState('');
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);

    const [metadata, setMetadata] = useState({
        white: '',
        black: '',
        event: 'Anàlisi',
        site: 'ChessEdMaster',
        date: new Date().toISOString().split('T')[0],
        result: '*'
    });

    const [initialFen, setInitialFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const [setupFen, setSetupFen] = useState(initialFen);
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('pgn_collections')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (!error && data) {
            setCollections(data);
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionTitle.trim()) {
            toast.error('Has d\'introduir un títol');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Has d\'estar loguejat per crear una BBDD');
                return;
            }

            const { data, error } = await supabase
                .from('pgn_collections')
                .insert({
                    title: newCollectionTitle,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setCollections([data, ...collections]);
                setSelectedCollection(data.id);
                setIsCreatingCollection(false);
                setNewCollectionTitle('');
                toast.success('BBDD creada correctament');
            }
        } catch (error: any) {
            console.error('Error creating collection:', error);
            toast.error('Error al crear la BBDD: ' + (error.message || 'Error desconegut'));
        }
    };

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleFinish = () => {
        if (!selectedCollection) {
            toast.error('Has de seleccionar una base de dades');
            return;
        }
        onComplete({
            collectionId: selectedCollection,
            metadata,
            initialFen: setupFen
        });
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Configuració de l'Anàlisi</h1>
                <div className="flex justify-center gap-4 mt-4">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-3 h-3 rounded-full ${step >= s ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                        />
                    ))}
                </div>
            </div>

            {step === 1 && (
                <GameCard className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Database className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">1. Selecciona la Base de Dades</h2>
                            <p className="text-sm text-zinc-400">On vols desar aquesta partida?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {collections.map((col) => (
                            <button
                                key={col.id}
                                onClick={() => setSelectedCollection(col.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedCollection === col.id
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'
                                    }`}
                            >
                                <FolderOpen size={20} className={selectedCollection === col.id ? 'text-indigo-400' : 'text-zinc-500'} />
                                <span className="font-bold">{col.title}</span>
                            </button>
                        ))}

                        {!isCreatingCollection ? (
                            <button
                                onClick={() => setIsCreatingCollection(true)}
                                className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-all text-zinc-400"
                            >
                                <Plus size={20} />
                                <span className="font-bold">Nova Base de Dades</span>
                            </button>
                        ) : (
                            <div className="col-span-1 md:col-span-2 flex gap-2">
                                <Input
                                    autoFocus
                                    placeholder="Títol de la BBDD..."
                                    value={newCollectionTitle}
                                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                                />
                                <Button onClick={handleCreateCollection} className="bg-indigo-600">Crear</Button>
                                <Button variant="ghost" onClick={() => setIsCreatingCollection(false)}>Cancel·lar</Button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button
                            disabled={!selectedCollection}
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-500 gap-2"
                        >
                            Següent <ArrowRight size={16} />
                        </Button>
                    </div>
                </GameCard>
            )}

            {step === 2 && (
                <GameCard className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Tag className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">2. Detalls de la Partida</h2>
                            <p className="text-sm text-zinc-400">Omple les etiquetes del PGN</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2">
                            <Label>Blanc</Label>
                            <Input
                                value={metadata.white}
                                onChange={(e) => setMetadata({ ...metadata, white: e.target.value })}
                                placeholder="Nom del jugador blanc"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Negre</Label>
                            <Input
                                value={metadata.black}
                                onChange={(e) => setMetadata({ ...metadata, black: e.target.value })}
                                placeholder="Nom del jugador negre"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Esdeveniment</Label>
                            <Input
                                value={metadata.event}
                                onChange={(e) => setMetadata({ ...metadata, event: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={metadata.date}
                                onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="ghost" onClick={handleBack} className="gap-2">
                            <ArrowLeft size={16} /> Enrere
                        </Button>
                        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                            Següent <ArrowRight size={16} />
                        </Button>
                    </div>
                </GameCard>
            )}

            {step === 3 && (
                <GameCard className="animate-in fade-in slide-in-from-bottom-4 p-0 overflow-hidden">
                    <div className="p-6 pb-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Layout className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">3. Posició Inicial</h2>
                                <p className="text-sm text-zinc-400">Comença des de zero o configura el tauler</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-0">
                        <BoardSetup
                            fen={setupFen}
                            onFenChange={setSetupFen}
                            selectedPiece={selectedPiece}
                            onSelectPiece={setSelectedPiece}
                            onClear={() => setSetupFen('8/8/8/8/8/8/8/8 w - - 0 1')}
                            onReset={() => setSetupFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}
                            onStartAnalysis={handleFinish}
                        />
                    </div>

                    <div className="p-4 bg-zinc-950/50 flex justify-between border-t border-zinc-800">
                        <Button variant="ghost" onClick={handleBack} className="gap-2 text-zinc-400">
                            <ArrowLeft size={16} /> Enrere
                        </Button>
                        {/* El botó de finalitzar ja està dins de BoardSetup com a "Començar Anàlisi" */}
                    </div>
                </GameCard>
            )}
        </div>
    );
}
