'use client';

import React, { useState, useEffect } from 'react';
import { ChessProvider, useChess } from '@/components/chess/chess-context';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Chessboard2D from '@/components/2d/Chessboard2D';
import ChessScene from '@/components/3d/ChessScene';
import { ExplorerPanel } from '@/components/analysis/ExplorerPanel';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GitBranch, LayoutGrid, Database, Settings, Save, FilePlus } from 'lucide-react';
import { EngineLinesPanel } from '@/components/analysis/EngineLinesPanel';
import { DatabasePanel } from '@/components/analysis/DatabasePanel';
import { AnnotationPanel } from '@/components/chess/annotation-panel';
import { AdvantageBar } from '@/components/analysis/AdvantageBar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SetupWorkflow } from '@/components/analysis/SetupWorkflow';


const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function AnalysisLayout() {
  const {
    fen,
    orientation,
    makeMove,
    goToMove,
    goToNode,
    currentHistoryIndex,
    mainLine,
    tree,
    currentNode,
    resetGame,
    isEvaluating,
    evaluation,
    lines,
    toggleEngine,
    engineEnabled,
    addComment,
    updateComment,
    removeComment,
    toggleNAG,
    setEvaluation,
    importPGN,
    setGameFromFen,
    undo,
    redo,
    revision
  } = useChess();

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [activeTab, setActiveTab] = useState<'analysis' | 'explorer' | 'database'>('analysis');
  const [sessionActive, setSessionActive] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collectionTitle, setCollectionTitle] = useState<string | null>(null);

  // Interaction State
  const [sourceSquare, setSourceSquare] = useState<string | null>(null);
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});

  const handleSquareClick = (square: string) => {
    if (sourceSquare === square) {
      setSourceSquare(null);
      setCustomSquareStyles({});
      return;
    }

    if (sourceSquare) {
      const moveMade = makeMove(sourceSquare, square);
      if (moveMade) {
        setSourceSquare(null);
        setCustomSquareStyles({});
      } else {
        setSourceSquare(null);
        setCustomSquareStyles({});
      }
    } else {
      setSourceSquare(square);
      setCustomSquareStyles({
        [square]: { background: 'rgba(255, 255, 0, 0.4)' }
      });
    }
  };

  const handleSetupComplete = async (data: { collectionId: string; metadata: Record<string, string>; initialFen: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Has d\'estar loguejat per iniciar una sessió');
        return;
      }

      // 1. Set initial position in tree
      setGameFromFen(data.initialFen);

      // 2. Add metadata (PGN tags) - Note: PGNTree might need a setMetadata method if not available
      // For now, let's assume we can set it via tree.getGame().metadata or similar
      Object.entries(data.metadata).forEach(([key, value]) => {
        tree.getGame().metadata[key] = value;
      });

      // 3. Create records in DB
      const { data: gameData, error } = await supabase
        .from('pgn_games')
        .insert({
          collection_id: data.collectionId,
          white: data.metadata.white || 'Unknown',
          black: data.metadata.black || 'Unknown',
          event: data.metadata.event || 'Analysis',
          site: data.metadata.site || 'ChessEdMaster',
          date: data.metadata.date || new Date().toISOString().split('T')[0],
          result: data.metadata.result || '*',
          pgn: tree.toString()
        })
        .select()
        .single();

      if (error) throw error;

      const { error: workError } = await supabase
        .from('work_pgns')
        .insert({
          game_id: gameData.id,
          data: tree.toJSON()
        });

      if (workError) console.error('Failed to create WorkPGN:', workError);

      setGameId(gameData.id);
      setCollectionId(data.collectionId);
      setSessionActive(true);
      toast.success('Sessió d\'anàlisi iniciada');
    } catch (e: any) {
      toast.error('Error al iniciar la sessió: ' + e.message);
    }
  };

  // AUTO-SAVE LOGIC
  useEffect(() => {
    if (!sessionActive || !gameId) return;

    const saveTimeout = setTimeout(async () => {
      try {
        const pgn = tree.toString();
        const workData = tree.toJSON();

        await supabase
          .from('pgn_games')
          .update({ pgn })
          .eq('id', gameId);

        await supabase
          .from('work_pgns')
          .update({ data: workData })
          .eq('game_id', gameId);

        console.log('Auto-saved analysis progress');
      } catch (e) {
        console.error('Auto-save failed:', e);
      }
    }, 2000); // Debounce auto-save

    return () => clearTimeout(saveTimeout);
  }, [tree, revision, sessionActive, gameId]); // revision is from useChess to detect tree changes

  const handleSaveGame = async () => {
    if (sessionActive && gameId) {
      toast.info('Aquesta partida s\'està desant automàticament.');
      return;
    }

    const title = prompt('Entra un títol per aquesta anàlisi:', 'Anàlisi de ' + new Date().toLocaleDateString());
    if (!title) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Has d\'estar loguejat per desar l\'anàlisi');
        return;
      }

      const pgn = tree.toString();
      const workData = tree.toJSON();

      // Look for any collection first to offer a default, or create "My Analyses"
      let { data: collections, error: colsError } = await supabase
        .from('pgn_collections')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (colsError) throw colsError;

      let targetCollectionId: string;

      if (!collections || collections.length === 0) {
        const { data: newCol, error: createError } = await supabase
          .from('pgn_collections')
          .insert({
            user_id: user.id,
            title: 'My Analyses',
            description: 'Default collection for your analysis sessions'
          })
          .select()
          .single();

        if (createError) throw createError;
        targetCollectionId = newCol.id;
      } else {
        // For now, use the most recent one. 
        // In a future update we could show a dialog to select.
        targetCollectionId = collections[0].id;
      }

      const { data: gameData, error } = await supabase
        .from('pgn_games')
        .insert({
          collection_id: targetCollectionId,
          white: user.email?.split('@')[0] || 'User',
          black: 'Engine/Analysis',
          event: title,
          pgn: pgn,
          result: '*',
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      const { error: workError } = await supabase
        .from('work_pgns')
        .insert({
          game_id: gameData.id,
          data: workData
        });

      if (workError) console.error('Failed to save WorkPGN:', workError);

      setGameId(gameData.id);
      setSessionActive(true);
      toast.success('Anàlisi desada i sessió activa!');
    } catch (e: any) {
      toast.error('Error al desar: ' + e.message);
    }
  };

  const handleNewAnalysis = () => {
    // Reset board and game state but keep collectionId
    resetGame();
    setGameId(null);
    setSessionActive(true); // Still in the same session/collection
    toast.info('Nova anàlisi iniciada a la mateixa col·lecció');
  };

  const handleLoadGame = async (id: string) => {
    try {
      setGameId(id);
      const { data, error } = await supabase
        .from('pgn_games')
        .select('pgn, collection_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        importPGN(data.pgn);
        setGameId(id);
        setCollectionId(data.collection_id);
        setSessionActive(true);
      }
    } catch (e: any) {
      toast.error('Error al carregar la partida: ' + e.message);
    }
  };

  const handleImportPGN = () => {
    const pgn = prompt('Enganxa el PGN aquí:');
    if (pgn) {
      importPGN(pgn);
    }
  };

  const getEvalText = (evalData: any) => {
    if (!evalData) return '...';
    if (evalData.type === 'mate') return evalData.value > 0 ? `M${Math.abs(evalData.value)}` : `-M${Math.abs(evalData.value)}`;
    const val = evalData.value / 100;
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  return (
    <div className="w-full h-full flex flex-col p-2 lg:p-4 gap-2 lg:gap-4 max-w-[1600px] mx-auto text-[var(--foreground)]">
      {!sessionActive ? (
        <SetupWorkflow onComplete={handleSetupComplete} />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-4 min-h-0 animate-in fade-in duration-500">


          {/* LEFT: Board Area */}
          <div className="flex-none lg:flex-1 flex flex-col gap-2 min-h-0 lg:min-h-full">
            {/* Board Wrapper */}
            <div className="w-full aspect-square lg:aspect-auto lg:h-full lg:flex-1 relative shrink-0">
              <div className="absolute inset-0 w-full h-full shadow-2xl rounded-xl overflow-hidden glass-panel bg-black/20 flex items-center justify-center border-4 lg:border-8 border-[var(--board-border)]">

                {/* Engine Overlay */}
                {engineEnabled && evaluation && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md border border-[var(--border)] px-3 py-1 rounded-full flex items-center gap-2 shadow-xl">
                    <div className={`w-2 h-2 rounded-full ${isEvaluating ? 'animate-pulse bg-emerald-500' : 'bg-[var(--color-secondary)]'}`} />
                    <span className={`font-mono font-bold text-sm ${evaluation.value > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {getEvalText(evaluation)}
                    </span>
                    <span className="text-[10px] text-[var(--color-secondary)] font-mono">d{evaluation.depth}</span>
                  </div>
                )}

                {/* Layout: Sidebar + Board */}
                <div className="flex w-full h-full">
                  {/* Advantage Bar */}
                  <div className="w-12 h-full py-8 px-2 flex-none hidden md:block">
                    <AdvantageBar evaluation={evaluation} orientation={orientation} />
                  </div>

                  <div className="flex-1 relative bg-[var(--board-bg)]">
                    {viewMode === '3d' ? (
                      <ChessScene
                        fen={fen}
                        orientation={orientation}
                        onSquareClick={handleSquareClick}
                      />
                    ) : (
                      <Chessboard2D
                        fen={fen}
                        orientation={orientation}
                        onSquareClick={handleSquareClick}
                        customSquareStyles={customSquareStyles}
                        arrows={lines.length > 0 ? [
                          {
                            from: lines[0].bestMove.substring(0, 2),
                            to: lines[0].bestMove.substring(2, 4),
                            color: 'rgba(34, 197, 94, 0.6)' // Neon Green with transparency
                          }
                        ] : []}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <Panel className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--panel-bg)] border-[var(--panel-border)] backdrop-blur-md mx-auto max-w-lg rounded-xl shadow-lg">
              <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={() => goToNode(null)} disabled={currentHistoryIndex === -1 && !currentNode} size="icon"><ChevronsLeft size={20} /></Button>
              <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={undo} size="icon"><ChevronLeft size={20} /></Button>
              <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={redo} size="icon"><ChevronRight size={20} /></Button>
              <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={() => goToMove(mainLine.length - 1)} size="icon"><ChevronsRight size={20} /></Button>
              <div className="h-6 w-px bg-[var(--color-border)] mx-2" />
              <div className="flex bg-[var(--input-bg)] rounded-lg p-0.5 border border-[var(--input-border)]">
                <button onClick={() => setViewMode('2d')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${viewMode === '2d' ? 'bg-[var(--color-secondary)] text-white shadow-sm' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}>2D</button>
                <button onClick={() => setViewMode('3d')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${viewMode === '3d' ? 'bg-[var(--color-secondary)] text-white shadow-sm' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}>3D</button>
              </div>
              <div className="h-6 w-px bg-[var(--color-border)] mx-2" />
              <div className="flex gap-1">
                <Button variant="ghost" className="hover:bg-indigo-500/10 text-indigo-400 gap-2 px-3" onClick={handleSaveGame} size="sm">
                  <Save size={16} /> <span className="text-[10px] font-bold uppercase">Save</span>
                </Button>
                <Button variant="ghost" className="hover:bg-amber-500/10 text-amber-500 gap-2 px-3" onClick={handleImportPGN} size="sm">
                  <FilePlus size={16} /> <span className="text-[10px] font-bold uppercase">Import</span>
                </Button>
              </div>
            </Panel>
          </div>

          {/* RIGHT: Analysis Tools */}
          <GameCard variant="default" className="w-full lg:w-[420px] h-full flex flex-col overflow-hidden bg-[var(--panel-bg)] border-[var(--panel-border)] p-0 shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-[var(--panel-border)] bg-[var(--color-muted)]/20 backdrop-blur">
              <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-[var(--color-secondary)]'}`}>
                <LayoutGrid size={16} /> <span className="text-[10px] font-bold uppercase">Analysis</span>
              </button>
              <button onClick={() => setActiveTab('explorer')} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'explorer' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-transparent text-[var(--color-secondary)]'}`}>
                <GitBranch size={16} /> <span className="text-[10px] font-bold uppercase">Explore</span>
              </button>
              <button onClick={() => setActiveTab('database')} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'database' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-transparent text-[var(--color-secondary)]'}`}>
                <Database size={16} /> <span className="text-[10px] font-bold uppercase">DB</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 relative bg-[var(--background)]/50 p-2 overflow-y-auto">
              {activeTab === 'analysis' && (
                <div className="flex flex-col gap-4 h-full">
                  {/* Engine Settings */}
                  <div className="flex items-center justify-between bg-[var(--panel-bg)] p-3 rounded-lg border border-[var(--border)]">
                    <span className="text-xs font-bold flex items-center gap-2">
                      <Settings size={14} /> Stockfish 16 (WASM)
                    </span>
                    <Switch checked={engineEnabled} onCheckedChange={toggleEngine} />
                  </div>

                  {/* Annotation Panel */}
                  <div className="flex-none">
                    <AnnotationPanel
                      node={currentNode}
                      onAddComment={(text) => addComment(text, 'after')}
                      onUpdateComment={updateComment}
                      onRemoveComment={removeComment}
                      onToggleNAG={toggleNAG}
                      onSetEvaluation={(e: any) => setEvaluation(e)}
                      isWorkMode={true}
                    />
                  </div>

                  {/* Engine Lines */}
                  <div className="flex-1 overflow-y-auto min-h-[200px]">
                    {engineEnabled ? (
                      <div className="space-y-2">
                        {lines.map((line) => (
                          <div key={line.id} className="bg-[var(--card-bg)] p-2 rounded border border-[var(--border)] text-xs font-mono">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-[var(--color-primary)]">{getEvalText(line.evaluation)}</span>
                              <span className="text-[var(--color-secondary)]">depth {line.evaluation.depth}</span>
                            </div>
                            <div className="truncate text-[var(--foreground)] opacity-80">
                              {line.pv.slice(0, 8).join(' ')}...
                            </div>
                          </div>
                        ))}
                        {lines.length === 0 && isEvaluating && <span className="text-xs text-[var(--color-secondary)] animate-pulse">Calculating...</span>}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-secondary)] text-xs italic">
                        Engine is disabled
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'explorer' && (
                <ExplorerPanel />
              )}

              {activeTab === 'database' && (
                <DatabasePanel
                  currentCollectionId={collectionId}
                  activeGameId={gameId}
                  onLoadGame={handleLoadGame}
                  onNewAnalysis={handleNewAnalysis}
                />
              )}
            </div>
          </GameCard>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <ChessProvider>
      <AnalysisLayout />
    </ChessProvider>
  );
}
