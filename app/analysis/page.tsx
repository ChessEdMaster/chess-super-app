'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Chess, Square, Move } from 'chess.js';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  LayoutGrid,
  Loader2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { CoachAgent } from '@/components/coach-agent';
import { PGNEditor } from '@/components/chess/pgn-editor';
import { OpeningExplorer } from '@/components/analysis/opening-explorer';
import { AnalysisControls } from '@/components/analysis/analysis-controls';
import { DatabaseManager } from '@/components/analysis/DatabaseManager';
import { BoardSetup } from '@/components/analysis/BoardSetup';
import { SyzygyContainer } from '@/components/analysis/SyzygyContainer';
import { EngineLinesPanel } from '@/components/analysis/EngineLinesPanel';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { Switch } from '@/components/ui/switch';
import { PGNTree } from '@/lib/pgn/tree';
import { PGNParser } from '@/lib/pgn/parser';
import type { Evaluation } from '@/types/pgn';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { supabase } from '@/lib/supabase';
import ChessScene from '@/components/3d/ChessScene';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';


interface EvaluationLine {
  id: number;
  evaluation: Evaluation;
  bestMove: string;
  line: string;
}

function AnalysisContent() {
  // --- STATE ---
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pgnTree, setPgnTree] = useState<PGNTree>(() => new PGNTree());
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isClient, setIsClient] = useState(false);
  const [createVariation, setCreateVariation] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'database' | 'setup'>('analysis');
  const [analysisMode, setAnalysisMode] = useState<'manual' | 'stockfish' | 'syzygy'>('manual');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Persistence State
  const [gameId, setGameId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedPgn = useRef<string>('');
  const [isWorkMode, setIsWorkMode] = useState(false);
  const [hasWorkPgn, setHasWorkPgn] = useState(false);

  // Setup State
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupSelectedPiece, setSetupSelectedPiece] = useState<string | null>('wP');

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
  const currentNode = pgnTree.getCurrentNode();

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsClient(true);
    const idFromUrl = searchParams.get('gameId');

    // Only load if the ID is different from what we have in state
    if (idFromUrl && idFromUrl !== gameId) {
      setGameId(idFromUrl);
      loadGameFromDB(idFromUrl);
    } else if (!idFromUrl && gameId) {
      setGameId(null);
      setPgnTree(new PGNTree());
    }
  }, [searchParams, gameId]);

  // --- AUTO SAVE ---
  const handleAutoSave = useCallback(async () => {
    if (!isClient) return;
    const currentPgn = pgnTree.toString();

    if (pgnTree.isAtStart() && pgnTree.getMainLine().length === 0) return;
    if (currentPgn === lastSavedPgn.current) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let targetGameId = gameId;

      // 1. Ensure Game Exists
      if (!targetGameId) {
        let collectionId: string | null = null;
        const { data: cols } = await supabase.from('pgn_collections').select('id').eq('title', 'My Analyses').eq('user_id', user.id).single();

        if (cols) {
          collectionId = cols.id;
        } else {
          const { data: newCol } = await supabase.from('pgn_collections').insert({
            user_id: user.id,
            title: 'My Analyses',
            description: 'Default collection for your analysis sessions'
          }).select().single();
          if (newCol) collectionId = newCol.id;
        }

        if (collectionId) {
          const { data: newGame } = await supabase.from('pgn_games').insert({
            collection_id: collectionId,
            pgn: currentPgn,
            white: pgnTree.getHeader('White') || '?',
            black: pgnTree.getHeader('Black') || '?',
            result: pgnTree.getHeader('Result') || '*',
            date: new Date().toISOString().split('T')[0],
            event: 'Analysis Session'
          }).select().single();

          if (newGame) {
            targetGameId = newGame.id;
            setGameId(newGame.id);
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('gameId', newGame.id);
            window.history.pushState({}, '', newUrl.toString());
          }
        }
      }

      // 2. Save Game Data (Standard or WorkPGN)
      if (targetGameId) {
        // 2. Save Game Data (Standard or WorkPGN)
        if (targetGameId) {
          // ALWAYS update the standard PGN to keep it interoperable
          const pgnUpdate = supabase.from('pgn_games').update({
            pgn: currentPgn,
            white: pgnTree.getHeader('White') || '?',
            black: pgnTree.getHeader('Black') || '?',
            result: pgnTree.getHeader('Result') || '*',
            date: pgnTree.getHeader('Date') || new Date().toISOString().split('T')[0],
            event: pgnTree.getHeader('Event') || 'Analysis Session',
            site: pgnTree.getHeader('Site') || '?',
            updated_at: new Date().toISOString()
          }).eq('id', targetGameId);

          if (isWorkMode) {
            const workData = pgnTree.toJSON();

            let workPromise;
            if (hasWorkPgn) {
              workPromise = supabase.from('work_pgns').update({
                data: workData as any,
                updated_at: new Date().toISOString()
              }).eq('game_id', targetGameId);
            } else {
              workPromise = supabase.from('work_pgns').insert({
                game_id: targetGameId,
                data: workData as any
              }).then(({ error }) => {
                if (!error) setHasWorkPgn(true);
                return { error };
              });
            }

            // Execute both
            await Promise.all([pgnUpdate, workPromise]);
          } else {
            // Only standard PGN
            await pgnUpdate;
          }
        }
      }

      lastSavedPgn.current = currentPgn;
      setLastSaved(new Date());

    } catch (err) {
      console.error("Auto-save failed", err);
      toast.error("Failed to save analysis");
    } finally {
      setIsSaving(false);
    }
  }, [gameId, isClient, pgnTree, isWorkMode, hasWorkPgn]);

  // Debounced Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [handleAutoSave]);


  async function loadGameFromDB(id: string) {
    try {
      const { data, error } = await supabase
        .from('pgn_games')
        .select(`
            pgn,
            work_pgns (id, data)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const workPgn = data.work_pgns && Array.isArray(data.work_pgns) ? data.work_pgns[0] : data.work_pgns;

        if (workPgn) {
          setHasWorkPgn(true);
          setIsWorkMode(true);
          // Load WorkPGN
          try {
            const newTree = PGNTree.fromJSON(workPgn.data);
            setPgnTree(newTree);
            // Set initial state
            const mainLine = newTree.getMainLine();
            if (mainLine.length > 0) {
              newTree.goToNode(mainLine[mainLine.length - 1]);
            } else {
              newTree.reset();
            }
            setFen(newTree.getCurrentFen());
            setGame(new Chess(newTree.getCurrentFen()));
          } catch (e) {
            console.error("Failed to parse WorkPGN", e);
            // Fallback to standard PGN
            if (data.pgn) {
              loadPGN(data.pgn);
              lastSavedPgn.current = data.pgn;
            }
          }
        } else {
          setHasWorkPgn(false);
          setIsWorkMode(false);
          if (data.pgn) {
            loadPGN(data.pgn);
            lastSavedPgn.current = data.pgn;
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading game:', error);
      toast.error(`Could not load game: ${error.message || 'Unknown error'}`);
    }
  }

  function loadPGN(pgn: string) {
    try {
      const newTree = PGNParser.parse(pgn);
      setPgnTree(newTree);
      const mainLine = newTree.getMainLine();
      if (mainLine.length > 0) {
        newTree.goToNode(mainLine[mainLine.length - 1]);
      } else {
        newTree.reset();
      }
      setFen(newTree.getCurrentFen());
      setGame(new Chess(newTree.getCurrentFen()));
    } catch (e) {
      console.error('Error parsing PGN:', e);
      toast.error("Invalid PGN format");
    }
  }

  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // --- ENGINE WORKER ---
  useEffect(() => {
    async function initEngine() {
      if (!engine.current) {
        const { supabase } = await import('@/lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();

        if (user && user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) {
          console.log("Initializing Native Server Engine for Superadmin");
          const { ServerEngineAdapter } = await import('@/lib/analysis/server-engine-adapter');
          // @ts-expect-error - Adapter matches Worker interface enough for our usage
          engine.current = new ServerEngineAdapter();
        } else {
          const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
          try {
            const response = await fetch(stockfishUrl);
            const code = await response.text();
            const blob = new Blob([code], { type: 'application/javascript' });
            const localWorkerUrl = URL.createObjectURL(blob);
            engine.current = new Worker(localWorkerUrl);
          } catch (err) {
            console.error("Failed to load Stockfish:", err);
            return;
          }
        }

        if (!engine.current) return;

        const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
        const threadsToUse = Math.max(1, cores - 1);
        const hashSize = 128;

        engine.current.postMessage('uci');
        engine.current.postMessage(`setoption name Threads value ${threadsToUse}`);
        engine.current.postMessage(`setoption name Hash value ${hashSize}`);
        engine.current.postMessage('setoption name UCI_AnalyseMode value true');
        engine.current.postMessage('setoption name Ponder value false');
        engine.current.postMessage('isready');

        engine.current.onmessage = (event) => {
          const msg = event.data;
          if (msg.startsWith('info') && msg.includes('depth')) {
            const multipvMatch = msg.match(/multipv (\d+)/);
            const multipvId = multipvMatch ? parseInt(multipvMatch[1]) : 1;
            const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
            const depthMatch = msg.match(/depth (\d+)/);
            let evalData: Evaluation | null = null;
            const depth = depthMatch ? parseInt(depthMatch[1]) : undefined;

            if (scoreMatch) {
              const type = scoreMatch[1] as 'cp' | 'mate';
              const value = parseInt(scoreMatch[2]);
              evalData = { type, value, depth };
            }

            const pvMatch = msg.match(/ pv ([a-h1-8]+(?:\s+[a-h1-8]+)*)/);
            if (pvMatch && evalData) {
              const moves = pvMatch[1].trim().split(/\s+/);
              if (moves.length > 0) {
                const bestMoveStr = moves[0];
                try {
                  const from = bestMoveStr.substring(0, 2);
                  const piece = gameRef.current.get(from as Square);
                  if (!piece || piece.color !== gameRef.current.turn()) return;
                } catch (e) { return; }

                const newLine: EvaluationLine = {
                  id: multipvId,
                  evaluation: evalData,
                  bestMove: moves[0],
                  line: moves.slice(0, 10).join(' ')
                };

                setLines(prev => {
                  const newLines = [...prev];
                  const index = newLines.findIndex(l => l.id === multipvId);
                  if (index !== -1) newLines[index] = newLine;
                  else newLines.push(newLine);
                  return newLines.sort((a, b) => a.id - b.id);
                });

                if (multipvId === 1) {
                  setEvaluation(evalData);
                  setBestMove(moves[0]);
                  setBestLine(moves.slice(0, 5).join(' '));
                }
              }
            }
          }
        };
      }
    }
    initEngine();
    return () => {
      engine.current?.terminate();
      engine.current = null;
    };
  }, []);

  // --- TRIGGER ANALYSIS ---
  useEffect(() => {
    if (!engine.current || !isClient) return;

    setLines([]);
    setEvaluation(null);
    setBestLine("");

    if (isAnalyzing && analysisMode === 'stockfish') {
      const timeoutId = setTimeout(() => {
        if (!engine.current) return;
        engine.current.postMessage('stop');
        engine.current.postMessage(`setoption name MultiPV value ${multipv}`);
        engine.current.postMessage(`position fen ${fen}`);
        engine.current.postMessage(`go depth ${engineDepth}`);
      }, 150);
      return () => clearTimeout(timeoutId);
    } else {
      if (engine.current) engine.current.postMessage('stop');
    }
  }, [fen, isClient, isAnalyzing, engineDepth, multipv, analysisMode]);

  // Helper to manually update FEN for setup (bypassing chess.js validation)
  const manualFenUpdate = (currentFen: string, square: string, piece: { type: string, color: string } | null) => {
    const parts = currentFen.split(' ');
    const boardStr = parts[0];
    const rows = boardStr.split('/');

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileIdx = files.indexOf(square[0]);
    const rankIdx = 8 - parseInt(square[1]);

    // Construct simplified board array
    let board: (string | null)[][] = [];
    for (let r = 0; r < 8; r++) {
      const rowArr: (string | null)[] = [];
      const rowStr = rows[r] || '8';
      for (let char of rowStr) {
        if (char >= '1' && char <= '8') {
          for (let k = 0; k < parseInt(char); k++) rowArr.push(null);
        } else {
          rowArr.push(char);
        }
      }
      while (rowArr.length < 8) rowArr.push(null); // safety
      board.push(rowArr);
    }

    // Update square
    if (piece) {
      const char = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
      board[rankIdx][fileIdx] = char;
    } else {
      board[rankIdx][fileIdx] = null;
    }

    // Reconstruct FEN
    const newRows = board.map(row => {
      let emptyCount = 0;
      let rowStr = '';
      for (let cell of row) {
        if (cell === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += cell;
        }
      }
      if (emptyCount > 0) rowStr += emptyCount;
      return rowStr;
    });

    return `${newRows.join('/')} ${parts.slice(1).join(' ')}`;
  };

  const handleSetupClick = (square: string) => {
    if (!setupSelectedPiece) return;

    try {
      // Try using chess.js first
      const gameSpec = new Chess(fen);

      if (setupSelectedPiece === 'trash') {
        gameSpec.remove(square as Square);
      } else {
        const color = setupSelectedPiece[0] as 'w' | 'b';
        const type = setupSelectedPiece[1].toLowerCase() as any;
        gameSpec.put({ type, color }, square as Square);
      }
      const newFen = gameSpec.fen();
      setFen(newFen);
      setGame(gameSpec);
    } catch (e) {
      // Fallback: Manual FEN manipulation if chess.js fails (e.g. empty board)
      let newFen = fen;
      if (setupSelectedPiece === 'trash') {
        newFen = manualFenUpdate(fen, square, null);
      } else {
        const color = setupSelectedPiece[0] as 'w' | 'b';
        const type = setupSelectedPiece[1].toLowerCase();
        newFen = manualFenUpdate(fen, square, { type, color });
      }
      setFen(newFen);
      // Try to sync game if possible, otherwise leave it stale (it won't be used for move logic in setup)
      try { setGame(new Chess(newFen)); } catch (e) { }
    }
  };

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (activeTab === 'setup') return false;
    if (!targetSquare) return false;
    const gameCopy = new Chess(fen);
    let move = null;
    try {
      move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    } catch (error) { return false; }

    if (!move) return false;

    const nextTree = pgnTree.clone();
    nextTree.addMove(move.san, createVariation);

    setGame(gameCopy);
    setFen(gameCopy.fen());
    setLastMove(move.san);
    setPgnTree(nextTree);
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
    if (activeTab === 'setup') {
      handleSetupClick(square);
      return;
    }

    if (moveFrom) {
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }
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
    try {
      setGame(new Chess(newFen));
    } catch (e) {
      console.warn("Invalid FEN for game state:", newFen);
    }
  };
  const goBack = () => {
    const nextTree = pgnTree.clone();
    const parent = nextTree.goBack();
    setPgnTree(nextTree);
    if (parent) {
      handlePositionChange(parent.fen);
    } else {
      handlePositionChange(nextTree.getGame().rootPosition);
    }
  };

  const goForward = () => {
    const nextTree = pgnTree.clone();
    const next = nextTree.goForward();
    setPgnTree(nextTree);
    if (next) {
      handlePositionChange(next.fen);
    }
  };

  const goToStart = () => {
    const nextTree = pgnTree.clone();
    nextTree.reset();
    setPgnTree(nextTree);
    handlePositionChange(nextTree.getGame().rootPosition);
  };

  const goToEnd = () => {
    const nextTree = pgnTree.clone();
    const mainLine = nextTree.getMainLine();
    if (mainLine.length > 0) {
      const lastNode = mainLine[mainLine.length - 1];
      nextTree.goToNode(lastNode);
      setPgnTree(nextTree);
      handlePositionChange(lastNode.fen);
    }
  };

  const getEvalText = (evalData: Evaluation | null) => {
    if (!evalData) return '...';
    if (evalData.type === 'mate') return evalData.value > 0 ? `M${Math.abs(evalData.value)}` : `-M${Math.abs(evalData.value)}`;
    const val = evalData.value / 100;
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  const analysisArrows = lines.map((line) => {
    if (!line.bestMove || line.bestMove.length < 4) return null;
    const from = line.bestMove.substring(0, 2);
    const to = line.bestMove.substring(2, 4);
    let color = '#ef4444';
    if (line.id === 1) color = '#22c55e';
    else if (line.id === 2) color = '#84cc16';
    else if (line.id === 3) color = '#eab308';
    else color = '#f97316';
    return { from, to, color };
  }).filter(Boolean) as { from: string, to: string, color: string }[];

  const pgnArrows = pgnTree.getCurrentNode()?.annotation.visualAnnotations
    ?.filter((a) => a.type === 'arrow' && a.from && a.to)
    .map((a) => ({ from: a.from!, to: a.to!, color: a.color })) || [];

  const allArrows = [...analysisArrows, ...pgnArrows];

  // --- ICONS for TABs ---
  const ActivityIcon = LayoutGrid;
  const DatabaseIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>);
  const SetupIcon = React.memo(() => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>);


  if (!isClient) return <div className="h-full flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Carregant...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col p-4">

      <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full w-full max-w-7xl mx-auto min-h-0">

        {/* LEFT COLUMN: Board + Controls */}
        <div className="flex-1 flex flex-col min-h-0 gap-3">

          {/* Board Container */}
          <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
            <div className="w-full h-full max-h-full aspect-square shadow-2xl rounded-2xl overflow-hidden glass-panel mx-auto bg-black/20 p-1 flex items-center justify-center relative border-8 border-zinc-800 ring-1 ring-white/10">
              {/* Engine Bar Overlay (Minimal) */}
              {isAnalyzing && evaluation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 shadow-xl">
                  <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'animate-pulse bg-emerald-500' : 'bg-zinc-500'}`} />
                  <span className={`font-mono font-bold text-sm ${evaluation.value > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {getEvalText(evaluation)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">d{evaluation.depth}</span>
                </div>
              )}

              {viewMode === '3d' ? (
                <ChessScene
                  fen={fen}
                  orientation={'white'}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  arrows={allArrows}
                />
              ) : (
                <div className="w-full h-full bg-zinc-900">
                  <Chessboard2D
                    fen={fen}
                    onSquareClick={onSquareClick}
                    orientation={game.turn() === 'b' ? 'black' : 'white'}
                    customSquareStyles={optionSquares}
                    arrows={allArrows}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <Panel className="flex items-center justify-center gap-2 w-full p-2 bg-zinc-900/60 border-zinc-800 mx-auto max-w-lg">
            <Button variant="ghost" className="hover:bg-zinc-800 text-zinc-400" onClick={goToStart} disabled={pgnTree.isAtStart()} size="icon"><ChevronsLeft size={20} /></Button>
            <Button variant="ghost" className="hover:bg-zinc-800 text-zinc-400" onClick={goBack} disabled={pgnTree.isAtStart()} size="icon"><ChevronLeft size={20} /></Button>
            <Button variant="ghost" className="hover:bg-zinc-800 text-zinc-400" onClick={goForward} disabled={pgnTree.isAtEnd()} size="icon"><ChevronRight size={20} /></Button>
            <Button variant="ghost" className="hover:bg-zinc-800 text-zinc-400" onClick={goToEnd} disabled={pgnTree.isAtEnd()} size="icon"><ChevronsRight size={20} /></Button>
            <div className="h-6 w-px bg-zinc-800 mx-2" />
            <Button variant="ghost" onClick={() => setCreateVariation(!createVariation)} className={createVariation ? "text-amber-500 bg-amber-500/10" : "text-zinc-500 hover:text-zinc-300"} size="icon" title="New Variation">
              <GitBranch size={18} />
            </Button>
            <div className="h-6 w-px bg-zinc-800 mx-2" />
            <div className="flex bg-zinc-950/50 rounded-lg p-0.5 border border-white/5">
              <button onClick={() => setViewMode('2d')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${viewMode === '2d' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}>2D</button>
              <button onClick={() => setViewMode('3d')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${viewMode === '3d' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}>3D</button>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: Tabbed Interface */}
        <GameCard variant="default" className="w-full lg:w-[420px] h-full flex flex-col overflow-hidden bg-zinc-900/80 border-zinc-800 p-0">

          {/* TAB HEADERS */}
          <div className="flex border-b border-black/20 bg-zinc-950/50 backdrop-blur">
            <button
              onClick={() => { setActiveTab('analysis'); setIsSetupMode(false); }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${activeTab === 'analysis' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
            >
              <ActivityIcon size={20} />
              <span className="text-[10px] font-bold tracking-wide">Analysis</span>
            </button>
            <button
              onClick={() => { setActiveTab('database'); setIsSetupMode(false); }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${activeTab === 'database' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
            >
              <DatabaseIcon />
              <span className="text-[10px] font-bold tracking-wide">Database</span>
            </button>
            <button
              onClick={() => { setActiveTab('setup'); setIsSetupMode(true); }}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all ${activeTab === 'setup' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
            >
              <SetupIcon />
              <span className="text-[10px] uppercase font-bold tracking-widest">Setup</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="flex-1 min-h-0 relative p-0 bg-transparent flex flex-col">
            {activeTab === 'analysis' && (
              <div className="flex flex-col h-full p-2 gap-2">
                {/* WORK MODE TOGGLE - Only show if game is saved */}
                {gameId && (
                  <div className="flex items-center justify-between bg-zinc-950/30 p-2 rounded-lg border border-white/5 mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Work Mode</span>
                      <span className="text-[10px] text-zinc-600">Rich editing & drawings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasWorkPgn && isWorkMode && <span className="text-[10px] text-zinc-500 italic">Unsaved</span>}
                      <Switch checked={isWorkMode} onCheckedChange={(checked) => setIsWorkMode(checked)} />
                    </div>
                  </div>
                )}

                {/* MODE SELECTOR */}
                <div className="flex bg-zinc-950/50 rounded-lg p-1 border border-white/5 shrink-0">
                  <button
                    onClick={() => setAnalysisMode('manual')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${analysisMode === 'manual' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setAnalysisMode('stockfish')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${analysisMode === 'stockfish' ? 'bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Stockfish
                  </button>
                  <button
                    onClick={() => setAnalysisMode('syzygy')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${analysisMode === 'syzygy' ? 'bg-amber-600/20 text-amber-400 shadow-sm border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Syzygy
                  </button>
                </div>

                {/* CONTENT BASED ON MODE */}

                {/* MANUAL MODE */}
                {analysisMode === 'manual' && (
                  <div className="flex-1 min-h-0 border border-white/5 rounded-lg overflow-hidden bg-zinc-900/30">
                    <PGNEditor
                      tree={pgnTree}
                      onTreeChange={setPgnTree}
                      onPositionChange={handlePositionChange}
                      currentMove={currentNode?.move || undefined}
                      autoAnnotate={true}
                      engineEval={evaluation}
                      isWorkMode={isWorkMode}
                      onAddImage={(url) => {
                        const nextTree = pgnTree.clone();
                        nextTree.addImage(url);
                        setPgnTree(nextTree);
                      }}
                      onRemoveImage={(index) => {
                        const nextTree = pgnTree.clone();
                        nextTree.removeImage(index);
                        setPgnTree(nextTree);
                      }}
                    />
                  </div>
                )}

                {/* STOCKFISH MODE */}
                {analysisMode === 'stockfish' && (
                  <div className="flex flex-col h-full gap-2 min-h-0">
                    <div className="shrink-0">
                      <AnalysisControls
                        isAnalyzing={isAnalyzing}
                        setIsAnalyzing={setIsAnalyzing}
                        depth={engineDepth}
                        setDepth={setEngineDepth}
                        multipv={multipv}
                        setMultipv={setMultipv}
                      />
                    </div>
                    <div className="h-[200px] shrink-0">
                      <EngineLinesPanel
                        lines={lines}
                        depth={evaluation?.depth || 0}
                        isAnalyzing={isAnalyzing}
                      />
                    </div>
                    <div className="flex-1 min-h-0 border border-white/5 rounded-lg overflow-hidden bg-zinc-900/30">
                      <PGNEditor
                        tree={pgnTree}
                        onTreeChange={setPgnTree}
                        onPositionChange={handlePositionChange}
                        currentMove={currentNode?.move || undefined}
                        autoAnnotate={true}
                        engineEval={evaluation}
                        isWorkMode={isWorkMode}
                        onAddImage={(url) => {
                          const newTree = new PGNTree();
                          Object.assign(newTree, pgnTree);
                          newTree.addImage(url);
                          setPgnTree(newTree);
                        }}
                        onRemoveImage={(index) => {
                          const newTree = new PGNTree();
                          Object.assign(newTree, pgnTree);
                          newTree.removeImage(index);
                          setPgnTree(newTree);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* SYZYGY MODE */}
                {analysisMode === 'syzygy' && (
                  <div className="flex-1 min-h-0">
                    <SyzygyContainer
                      fen={fen}
                      onPlayMove={(uci) => {
                        // Convert/Play UCI move
                        const from = uci.substring(0, 2);
                        const to = uci.substring(2, 4);
                        onDrop(from, to);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'database' && (
              <div className="flex-1 p-2 overflow-hidden">
                <DatabaseManager
                  onLoadGame={(pgn) => {
                    loadPGN(pgn);
                    setActiveTab('analysis');
                  }}
                  currentPgn={pgnTree.toString()}
                />
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="flex-1 p-2 flex items-center justify-center overflow-auto">
                <BoardSetup
                  fen={fen}
                  onFenChange={handlePositionChange}
                  selectedPiece={setupSelectedPiece}
                  onSelectPiece={setSetupSelectedPiece}
                  onClear={() => handlePositionChange('8/8/8/8/8/8/8/8 w - - 0 1')}
                  onReset={() => handlePositionChange('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}
                  onStartAnalysis={() => setActiveTab('analysis')}
                />
              </div>
            )}
          </div>
        </GameCard>

      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <React.Suspense fallback={<div className="h-full flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Carregant...</div>}>
      <AnalysisContent />
    </React.Suspense>
  );
}
