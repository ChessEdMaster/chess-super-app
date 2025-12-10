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
import { PGNEditor } from '@/components/chess/pgn-editor';
import { OpeningExplorer } from '@/components/analysis/opening-explorer';
import { AnalysisControls } from '@/components/analysis/analysis-controls';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { PGNTree } from '@/lib/pgn/tree';
import { PGNParser } from '@/lib/pgn/parser';
import type { Evaluation } from '@/types/pgn';
import Chessboard2D from '@/components/2d/Chessboard2D';

interface EvaluationLine {
  id: number;
  evaluation: Evaluation;
  bestMove: string;
  line: string;
}
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
  const [lines, setLines] = useState<EvaluationLine[]>([]);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [bestLine, setBestLine] = useState<string>("");
  const [lastMove, setLastMove] = useState<string | null>(null);

  // Settings
  const { boardTheme } = useSettings();

  // Derived state
  const currentNode = pgnTree.getCurrentNode();

  // --- INITIALIZATION ---
  // --- INITIALIZATION ---
  useEffect(() => {
    setIsClient(true);
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');

    if (gameId) {
      loadGameFromDB(gameId);
    } else {
      const savedPGN = localStorage.getItem('analysis_pgn');
      if (savedPGN) {
        loadPGN(savedPGN);
        localStorage.removeItem('analysis_pgn');
      }
    }
  }, []);

  async function loadGameFromDB(gameId: string) {
    try {
      // Dynamic import to avoid SSR issues if any, though we are in useEffect
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('games')
        .select('pgn')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      if (data && data.pgn) {
        loadPGN(data.pgn);
      }
    } catch (error) {
      console.error('Error loading game:', error);
    }
  }

  function loadPGN(pgn: string) {
    try {
      const newTree = PGNParser.parse(pgn);
      setPgnTree(newTree);
      const mainLine = newTree.getMainLine();
      if (mainLine.length > 0) {
        newTree.goToNode(mainLine[mainLine.length - 1]);
      }
      setFen(newTree.getCurrentFen());
      setGame(new Chess(newTree.getCurrentFen()));
    } catch (e) {
      console.error('Error parsing PGN:', e);
    }
  }

  // --- ENGINE WORKER ---
  useEffect(() => {
    if (!engine.current) {
      // Using a reliable CDN for Stockfish.js
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

      // Create worker from blob to avoid cross-origin issues with some CDNs
      fetch(stockfishUrl)
        .then(response => response.text())
        .then(code => {
          const blob = new Blob([code], { type: 'application/javascript' });
          const localWorkerUrl = URL.createObjectURL(blob);
          engine.current = new Worker(localWorkerUrl);
          engine.current.postMessage('uci');
          console.log("Stockfish engine initialized");

          engine.current.onmessage = (event) => {
            const msg = event.data;
            // Parse info
            if (msg.startsWith('info') && msg.includes('depth')) {
              // Parse multipv ID (default to 1)
              const multipvMatch = msg.match(/multipv (\d+)/);
              const multipvId = multipvMatch ? parseInt(multipvMatch[1]) : 1;

              const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
              let evalData: Evaluation | null = null;

              if (scoreMatch) {
                const type = scoreMatch[1] as 'cp' | 'mate';
                let value = parseInt(scoreMatch[2]);
                evalData = { type, value };

                // Update primary evaluation if this is the best line
                if (multipvId === 1) {
                  setEvaluation(evalData);
                }
              }

              const pvMatch = msg.match(/ pv ([a-h1-8]+(?:\s+[a-h1-8]+)*)/);
              if (pvMatch && evalData) {
                const moves = pvMatch[1].trim().split(/\s+/);
                if (moves.length > 0) {
                  const newLine: EvaluationLine = {
                    id: multipvId,
                    evaluation: evalData,
                    bestMove: moves[0],
                    line: moves.slice(0, 10).join(' ')
                  };

                  setLines(prev => {
                    const newLines = [...prev];
                    const index = newLines.findIndex(l => l.id === multipvId);
                    if (index !== -1) {
                      newLines[index] = newLine;
                    } else {
                      newLines.push(newLine);
                    }
                    return newLines.sort((a, b) => a.id - b.id);
                  });

                  if (multipvId === 1) {
                    setBestMove(moves[0]);
                    setBestLine(moves.slice(0, 5).join(' '));
                  }
                }
              }
            }
          };
        })
        .catch(err => console.error("Failed to load Stockfish:", err));
    }
    return () => {
      engine.current?.terminate();
      engine.current = null;
    };
  }, []);

  // --- TRIGGER ANALYSIS ---
  useEffect(() => {
    if (!engine.current || !isClient) return;

    if (isAnalyzing) {
      console.log("Starting analysis for FEN:", fen);
      // Clean up previous lines
      setLines([]);
      setEvaluation(null);

      engine.current.postMessage('stop');
      engine.current.postMessage(`setoption name MultiPV value ${multipv}`);
      engine.current.postMessage(`position fen ${fen}`);
      engine.current.postMessage(`go depth ${engineDepth}`);
    } else {
      console.log("Stopping analysis");
      engine.current.postMessage('stop');
      setEvaluation(null);
      setLines([]);
    }

  }, [fen, isClient, isAnalyzing, engineDepth, multipv]);

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

  const getEvalText = (evalData: Evaluation | null) => {
    if (!evalData) return '...';
    if (evalData.type === 'mate') return evalData.value > 0 ? `M${Math.abs(evalData.value)}` : `-M${Math.abs(evalData.value)}`;
    const val = evalData.value / 100;
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  // Derive arrows from analysis lines
  const analysisArrows = lines.map((line) => {
    if (!line.bestMove || line.bestMove.length < 4) return null;
    const from = line.bestMove.substring(0, 2);
    const to = line.bestMove.substring(2, 4);

    // Color logic
    let color = '#ef4444'; // default red

    if (lines.length > 5) {
      // Full analysis mode color coding
      const bestEval = lines.find(l => l.id === 1)?.evaluation.value || 0;
      const diff = bestEval - line.evaluation.value;

      if (line.id === 1) color = '#06b6d4'; // Cyan for best
      else if (diff < 50) color = '#22c55e'; // < 0.5 pawn loss
      else if (diff < 150) color = '#eab308'; // < 1.5 pawn loss
      else color = '#ef4444'; // > 1.5 pawn loss
    } else {
      // Standard mode
      if (line.id === 1) color = '#22c55e'; // Best = Green
      else if (line.id === 2) color = '#84cc16'; // 2nd = Lime
      else if (line.id === 3) color = '#eab308'; // 3rd = Yellow
      else color = '#f97316'; // 4+ = Orange
    }

    return { from, to, color };
  }).filter(Boolean) as { from: string, to: string, color: string }[];

  if (!isClient) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Carregant...</div>;

  return (
    <div className="h-dvh w-full grid grid-rows-[auto_1fr] lg:grid-rows-none lg:grid-cols-[1fr_400px] overflow-hidden text-zinc-100">

      {/* LEFT: BOARD AREA */}
      <div className="flex flex-col items-center justify-center bg-zinc-900/50 p-2 lg:p-4 relative">

        {/* Board Container */}
        {/* Mobile: max-w-[95vw] to be wider. Desktop: max-w-[65vh] to be smaller and match Play page */}
        <div className="w-full max-w-[95vw] lg:max-w-[65vh] aspect-square relative z-0 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
          {viewMode === '3d' ? (
            <ChessScene fen={fen} orientation="white" onSquareClick={onSquareClick} customSquareStyles={optionSquares} />
          ) : (
            <div className="w-full h-full">
              {/* @ts-ignore - Arrows prop added dynamically */}
              <Chessboard2D fen={fen} orientation="white" onSquareClick={onSquareClick} customSquareStyles={optionSquares} arrows={analysisArrows} />
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
                <CoachAgent evaluation={evaluation} previousEval={currentNode?.parent?.annotation?.evaluation || null} currentMove={currentNode?.move || null} turn={game.turn()} />

                {/* Best Line Info */}
                {/* Analysis Lines */}
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg overflow-hidden flex flex-col max-h-48 overflow-y-auto">
                  <div className="px-3 py-2 bg-zinc-900/50 text-xs text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                    Anàlisi del Motor ({isAnalyzing ? `Calculant...` : 'Aturat'})
                  </div>

                  {lines.length > 0 ? (
                    <div>
                      {lines.map((line) => (
                        <div key={line.id} className="p-2 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition flex items-start gap-3 text-sm font-mono group">
                          <div className={`w-12 shrink-0 font-bold text-right ${line.evaluation.value > 0
                            ? 'text-emerald-400'
                            : line.evaluation.value < 0
                              ? 'text-rose-400'
                              : 'text-zinc-400'
                            }`}>
                            {getEvalText(line.evaluation)}
                          </div>
                          <div className="text-zinc-300 break-all leading-relaxed">
                            <span className="text-indigo-400 font-bold mr-2">{line.bestMove}</span>
                            <span className="text-zinc-500">{line.line.substring(line.bestMove.length)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-zinc-500 text-xs py-8 italic">
                      {isAnalyzing ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={14} /> Buscant les millors jugades...</span> : 'Motor aturat. Prem "Analitzar" per començar.'}
                    </div>
                  )}
                </div>

                <PGNEditor tree={pgnTree} onTreeChange={setPgnTree} onPositionChange={handlePositionChange} currentMove={currentNode?.move || undefined} autoAnnotate={true} engineEval={evaluation} />
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


