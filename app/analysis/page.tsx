'use client';

import React, { useState } from 'react';
import { ChessProvider, useChess } from '@/components/chess/chess-context';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Chessboard2D from '@/components/2d/Chessboard2D';
import ChessScene from '@/components/3d/ChessScene';
import { ExplorerPanel } from '@/components/analysis/ExplorerPanel';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GitBranch, LayoutGrid, Database, Settings, Save } from 'lucide-react';
import { EngineLinesPanel } from '@/components/analysis/EngineLinesPanel'; // We can reuse or update this
import { DatabasePanel } from '@/components/analysis/DatabasePanel';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function AnalysisLayout() {
  const {
    fen,
    orientation,
    makeMove,
    goToMove,
    currentHistoryIndex,
    history,
    resetGame,
    isEvaluating,
    evaluation,
    lines,
    toggleEngine,
    engineEnabled
  } = useChess();

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [activeTab, setActiveTab] = useState<'analysis' | 'explorer' | 'database'>('analysis');

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
      // Attempt move
      const moveMade = makeMove(sourceSquare, square);
      if (moveMade) {
        setSourceSquare(null);
        setCustomSquareStyles({});
      } else {
        // If invalid move, but clicked on own piece, switch selection
        // We don't have easy access to piece ownership here without querying game state
        // For now, just reset
        setSourceSquare(null);
        setCustomSquareStyles({});
      }
    } else {
      // Select piece
      setSourceSquare(square);
      setCustomSquareStyles({
        [square]: { background: 'rgba(255, 255, 0, 0.4)' }
      });
    }
  };

  // Navigation handlers
  const goBack = () => goToMove(currentHistoryIndex - 1);
  const goForward = () => goToMove(currentHistoryIndex + 1);
  const goToStart = () => goToMove(0);
  const goToEnd = () => goToMove(history.length - 1);

  const handleSaveGame = async () => {
    const title = prompt('Entra un títol per aquesta anàlisi:', 'Anàlisi de ' + new Date().toLocaleDateString());
    if (!title) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Has d\'estar loguejat per desar l\'anàlisi');
        return;
      }

      // We need a PGN. Since useChess only gives FEN history, we can generate a basic PGN.
      // Or if we had a pgnTree we would use it. 
      // For now, let's just save the current FEN and some metadata.
      // But the table is 'pgn_games', so it expects PGN.
      const { Chess } = await import('chess.js');
      const tempGame = new Chess();
      // Replay history to build PGN
      history.forEach(f => {
        try {
          if (f !== INITIAL_FEN) {
            // This is actually complex because we don't have the moves, only FENS.
            // chess.js move() needs san/uci. 
            // Better: if we had a pgn generator.
          }
        } catch (e) { }
      });

      // Quick fix: Use the current FEN as the "PGN" or just a very simple PGN with FEN tag.
      const pgn = `[FEN "${fen}"]\n*`;

      // 1. Get or Create Collection
      let { data: collection, error: colError } = await supabase
        .from('pgn_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', 'My Analyses')
        .maybeSingle();

      if (colError) throw colError;

      if (!collection) {
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
        collection = newCol;
      }

      // 2. Insert Game
      const { error } = await supabase
        .from('pgn_games')
        .insert({
          collection_id: collection.id,
          white: user.email?.split('@')[0] || 'User',
          black: 'Engine/Analysis',
          event: title,
          pgn: pgn,
          result: '*',
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      toast.success('Anàlisi desada correctament!');
    } catch (e: any) {
      toast.error('Error al desar: ' + e.message);
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
      <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-4 min-h-0">

        {/* LEFT: Board Area */}
        <div className="flex-none lg:flex-1 flex flex-col gap-2 min-h-0 lg:min-h-full">
          {/* Board */}
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

              {viewMode === '3d' ? (
                <ChessScene
                  fen={fen}
                  orientation={orientation}
                  onSquareClick={handleSquareClick}
                />
              ) : (
                <div className="w-full h-full bg-[var(--board-bg)]">
                  <Chessboard2D
                    fen={fen}
                    orientation={orientation}
                    onSquareClick={handleSquareClick}
                    customSquareStyles={customSquareStyles}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <Panel className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--panel-bg)] border-[var(--panel-border)] backdrop-blur-md mx-auto max-w-lg rounded-xl shadow-lg">
            <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={goToStart} disabled={currentHistoryIndex === 0} size="icon"><ChevronsLeft size={20} /></Button>
            <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={goBack} disabled={currentHistoryIndex === 0} size="icon"><ChevronLeft size={20} /></Button>
            <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={goForward} disabled={currentHistoryIndex === history.length - 1} size="icon"><ChevronRight size={20} /></Button>
            <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)]" onClick={goToEnd} disabled={currentHistoryIndex === history.length - 1} size="icon"><ChevronsRight size={20} /></Button>
            <div className="h-6 w-px bg-[var(--color-border)] mx-2" />
            <div className="flex bg-[var(--input-bg)] rounded-lg p-0.5 border border-[var(--input-border)]">
              <button onClick={() => setViewMode('2d')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${viewMode === '2d' ? 'bg-[var(--color-secondary)] text-white shadow-sm' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}>2D</button>
              <button onClick={() => setViewMode('3d')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${viewMode === '3d' ? 'bg-[var(--color-secondary)] text-white shadow-sm' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}>3D</button>
            </div>
            <div className="h-6 w-px bg-[var(--color-border)] mx-2" />
            <Button variant="ghost" className="hover:bg-indigo-500/10 text-indigo-400 gap-2 px-3" onClick={handleSaveGame} size="sm">
              <Save size={16} /> <span className="text-[10px] font-bold uppercase">Save</span>
            </Button>
          </Panel>
        </div>

        {/* RIGHT: Analysis Tools */}
        <GameCard variant="default" className="w-full lg:w-[420px] h-full flex flex-col overflow-hidden bg-[var(--panel-bg)] border-[var(--panel-border)] p-0 shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-[var(--panel-border)] bg-[var(--color-muted)]/20 backdrop-blur">
            <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-[var(--color-secondary)]'}`}>
              <LayoutGrid size={16} /> <span className="text-[10px] font-bold uppercase">Engine</span>
            </button>
            <button onClick={() => setActiveTab('explorer')} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'explorer' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-transparent text-[var(--color-secondary)]'}`}>
              <GitBranch size={16} /> <span className="text-[10px] font-bold uppercase">Explore</span>
            </button>
            <button onClick={() => setActiveTab('database')} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'database' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-transparent text-[var(--color-secondary)]'}`}>
              <Database size={16} /> <span className="text-[10px] font-bold uppercase">DB</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 relative bg-[var(--background)]/50 p-2">
            {activeTab === 'analysis' && (
              <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between bg-[var(--panel-bg)] p-3 rounded-lg border border-[var(--border)]">
                  <span className="text-xs font-bold flex items-center gap-2">
                    <Settings size={14} /> Stockfish 16 (WASM)
                  </span>
                  <Switch checked={engineEnabled} onCheckedChange={toggleEngine} />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {/* Simple Lines Render for now */}
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
              <DatabasePanel />
            )}
          </div>
        </GameCard>
      </div>
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
