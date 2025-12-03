'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  GitBranch,
  LayoutGrid,
  Box,
  Cpu,
  Settings,
  Loader2
} from 'lucide-react';
import { CoachAgent } from '@/components/coach-agent';
import { PGNEditor } from '@/components/pgn-editor';
import { OpeningExplorer } from '@/components/analysis/opening-explorer';
import { AnalysisControls } from '@/components/analysis/analysis-controls';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { PGNTree } from '@/lib/pgn-tree';
import { PGNParser } from '@/lib/pgn-parser';
import type { Evaluation } from '@/lib/pgn-types';
import Chessboard2D from '@/components/2d/Chessboard2D';
import ChessScene from '@/components/3d/ChessScene';
import { Button } from '@/components/ui/button';

export default function AnalysisPage() {
  // --- STATE ---
  const [pgnTree, setPgnTree] = useState<PGNTree>(() => new PGNTree());
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isClient, setIsClient] = useState(false);
  const [createVariation, setCreateVariation] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'database'>('analysis');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Click to move state
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

  // --- ENGINE STATE ---
  const engine = useRef<Worker | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engineDepth, setEngineDepth] = useState(15);
  const [multipv, setMultipv] = useState(1);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [bestLine, setBestLine] = useState<string>("");
  const [lastMove, setLastMove] = useState<string | null>(null);

  // Settings
  const { boardTheme } = useSettings();

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsClient(true);
    const savedPGN = localStorage.getItem('analysis_pgn');
    if (savedPGN) {
      try {
        const newTree = PGNParser.parse(savedPGN);
        setPgnTree(newTree);
        const mainLine = newTree.getMainLine();
        if (mainLine.length > 0) {
          newTree.goToNode(mainLine[mainLine.length - 1]);
        }
        setFen(newTree.getCurrentFen());
        setGame(new Chess(newTree.getCurrentFen()));
        localStorage.removeItem('analysis_pgn');
      } catch (e) {
        console.error('Error loading PGN:', e);
      }
    }
  }, []);

  // --- ENGINE WORKER ---
  useEffect(() => {
    if (!engine.current) {
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
      const workerCode = `importScripts('${stockfishUrl}');`;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const localWorkerUrl = URL.createObjectURL(blob);
      engine.current = new Worker(localWorkerUrl);
      engine.current.postMessage('uci');
    }
    return () => {
      engine.current?.terminate();
      engine.current = null;
    };
  }, []);

  // --- ENGINE OPTIONS ---
  useEffect(() => {
    if (engine.current) {
      engine.current.postMessage(`setoption name MultiPV value ${multipv}`);
    }
  }, [multipv]);

  // --- ENGINE LISTENER ---
  useEffect(() => {
    if (!engine.current) return;

    engine.current.onmessage = (event) => {
      const msg = event.data;

      // Parse info
      if (msg.startsWith('info') && msg.includes(`depth ${engineDepth}`)) {
        const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          const type = scoreMatch[1] as 'cp' | 'mate';
          let value = parseInt(scoreMatch[2]);
          const currentGame = new Chess(fen);
          if (currentGame.turn() === 'b') value = -value;
          setEvaluation({ type, value });
        }

        const pvMatch = msg.match(/ pv ([a-h1-8]+(?:\s+[a-h1-8]+)*)/);
        if (pvMatch) {
          const moves = pvMatch[1].trim().split(/\s+/);
          if (moves.length > 0) {
            setBestMove(moves[0]);
            setBestLine(moves.slice(0, 5).join(' '));
          }
        }
      }
    };
  }, [fen, engineDepth]);

  // --- TRIGGER ANALYSIS ---
  useEffect(() => {
    if (!engine.current || !isClient) return;

    if (isAnalyzing) {
      engine.current.postMessage('stop');
      engine.current.postMessage(`position fen ${fen}`);
      engine.current.postMessage(`go depth ${engineDepth}`);
    } else {
      engine.current.postMessage('stop');
    }

  }, [fen, isClient, isAnalyzing, engineDepth]);

  // --- GAME LOGIC ---
  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (!targetSquare) return false;
    const gameCopy = new Chess(fen);
    let move = null;
    try {
      move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    } catch (error) { return false; }

    if (!move) return false;

    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    newTree.addMove(move.san, createVariation);

    setGame(gameCopy);
    setFen(gameCopy.fen());
    setLastMove(move.san);
    setPgnTree(newTree);
    if (createVariation) setCreateVariation(false);
    return true;
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({ square: square as Square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.forEach((move) => {
      const targetPiece = game.get(move.to as Square);
      const sourcePiece = game.get(square as Square);
      const isCapture = targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color;
      newSquares[move.to] = {
        background: isCapture ? 'radial-gradient(circle, rgba(255,0,0,.5) 25%, transparent 25%)' : 'radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    if (moveFrom) {
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moveResult = onDrop(moveFrom, square);
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
      const clickedPiece = game.get(square as Square);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
        return;
      }
      setMoveFrom(null);
      setOptionSquares({});
    } else {
      const piece = game.get(square as Square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
    }
  }

  // --- NAVIGATION ---
  const handlePositionChange = (newFen: string) => {
    setFen(newFen);
    setGame(new Chess(newFen));
  };
  const goBack = () => {
    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    newTree.goBack();
    handlePositionChange(newTree.getCurrentFen());
    setPgnTree(newTree);
  };
  const goForward = () => {
    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    newTree.goForward();
    handlePositionChange(newTree.getCurrentFen());
    setPgnTree(newTree);
  };
  const goToStart = () => {
    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    newTree.reset();
    handlePositionChange(newTree.getCurrentFen());
    setPgnTree(newTree);
  };
  const goToEnd = () => {
    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    const mainLine = newTree.getMainLine();
    if (mainLine.length > 0) {
      newTree.goToNode(mainLine[mainLine.length - 1]);
      handlePositionChange(newTree.getCurrentFen());
      setPgnTree(newTree);
    }
  };

  const getEvalText = () => {
    if (!evaluation) return '...';
    if (evaluation.type === 'mate') return evaluation.value > 0 ? `M${Math.abs(evaluation.value)}` : `-M${Math.abs(evaluation.value)}`;
    const val = evaluation.value / 100;
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  if (!isClient) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Carregant...</div>;

  return (
    <div className="h-dvh w-full grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden bg-zinc-950 text-zinc-100">

      {/* LEFT: BOARD AREA */}
      <div className="flex flex-col items-center justify-center bg-zinc-900/50 p-2 lg:p-4 relative">

        {/* Board Container */}
        {/* Mobile: max-w-[95vw] to be wider. Desktop: max-w-[65vh] to be smaller and match Play page */}
        <div className="w-full max-w-[95vw] lg:max-w-[65vh] aspect-square relative z-0 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
          {viewMode === '3d' ? (
            <ChessScene fen={fen} orientation="white" onSquareClick={onSquareClick} customSquareStyles={optionSquares} />
          ) : (
            <div className="w-full h-full">
              <Chessboard2D fen={fen} orientation="white" onSquareClick={onSquareClick} customSquareStyles={optionSquares} />
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-2 mt-4 w-full max-w-[600px]">
          <Button variant="secondary" onClick={goToStart} disabled={pgnTree.isAtStart()} size="sm"><ChevronsLeft size={18} /></Button>
          <Button variant="secondary" onClick={goBack} disabled={pgnTree.isAtStart()} size="sm"><ChevronLeft size={18} /></Button>
          <Button variant="secondary" onClick={goForward} disabled={pgnTree.isAtEnd()} size="sm"><ChevronRight size={18} /></Button>
          <Button variant="secondary" onClick={goToEnd} disabled={pgnTree.isAtEnd()} size="sm"><ChevronsRight size={18} /></Button>
          <div className="h-6 w-px bg-zinc-800 mx-2" />
          <Button variant={createVariation ? "default" : "outline"} onClick={() => setCreateVariation(!createVariation)} className={createVariation ? "bg-amber-600 hover:bg-amber-500" : ""} size="sm">
            <GitBranch size={18} />
          </Button>
          <div className="flex bg-zinc-800 rounded-lg p-1 ml-auto">
            <button onClick={() => setViewMode('2d')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === '2d' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>2D</button>
            <button onClick={() => setViewMode('3d')} className={`px-3 py-1 rounded text-xs font-bold ${viewMode === '3d' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}>3D</button>
          </div>
        </div>
      </div>

      {/* RIGHT: ANALYSIS PANEL */}
      <div className="flex flex-col border-l border-zinc-800 bg-zinc-900 h-full overflow-hidden relative">

        {/* Header */}
        <div className="flex-none p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur z-10 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <LayoutGrid size={18} className="text-emerald-500" />
            Laboratori
          </h2>
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button onClick={() => setActiveTab('analysis')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'analysis' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Anàlisi</button>
            <button onClick={() => setActiveTab('database')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'database' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Base de Dades</button>
          </div>
        </div>

        {/* Scrollable Content - Hide Scrollbar */}
        <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
          {activeTab === 'analysis' ? (
            <div className="flex flex-col min-h-full">
              <div className="p-4 space-y-4 flex-1">
                <CoachAgent evaluation={evaluation} previousEval={null} currentMove={lastMove} turn={game.turn()} />

                {/* Best Line Info */}
                <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-lg font-mono text-sm">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-bold">Millor Línia</div>
                  {bestLine ? (
                    <div className="text-emerald-400 break-words leading-relaxed">
                      <span className="font-bold text-white mr-2">{getEvalText()}</span>
                      {bestLine}
                    </div>
                  ) : (
                    <div className="text-zinc-600 italic flex items-center gap-2">
                      {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : null}
                      {isAnalyzing ? 'Calculant...' : 'Motor aturat'}
                    </div>
                  )}
                </div>

                <PGNEditor tree={pgnTree} onTreeChange={setPgnTree} onPositionChange={handlePositionChange} currentMove={lastMove || undefined} autoAnnotate={true} engineEval={evaluation} />
              </div>
            </div>
          ) : (
            <div className="h-full">
              <OpeningExplorer fen={fen} onSelectMove={(uci) => {
                // Simple wrapper to call onDrop logic for explorer moves
                const from = uci.substring(0, 2);
                const to = uci.substring(2, 4);
                onDrop(from, to);
              }} />
            </div>
          )}
        </div>

        {/* Fixed Footer Controls */}
        <div className="flex-none z-20 bg-zinc-900 border-t border-zinc-800">
          <AnalysisControls
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            depth={engineDepth}
            setDepth={setEngineDepth}
            multipv={multipv}
            setMultipv={setMultipv}
          />
        </div>

      </div>
    </div>
  );
}
