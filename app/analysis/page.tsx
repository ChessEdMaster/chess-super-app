'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Chess } from 'chess.js';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Save,
  Share2,
  Cpu,
  Settings,
  Loader2,
  GitBranch,
  Box,
  LayoutGrid
} from 'lucide-react';
import { CoachAgent } from '@/components/coach-agent';
import { PGNEditor } from '@/components/pgn-editor';
import { OpeningExplorer } from '@/components/analysis/opening-explorer';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { PGNTree } from '@/lib/pgn-tree';
import { PGNParser } from '@/lib/pgn-parser';
import type { Evaluation } from '@/lib/pgn-types';
import SmartChessboard from '@/components/smart-chessboard';
import ChessScene from '@/components/3d/ChessScene';
import { Button } from '@/components/ui/button';

// Configuració del Motor
const ENGINE_DEPTH = 15; // Profunditat d'anàlisi (15 és ràpid i fort)

export default function AnalysisPage() {
  // --- ESTAT DEL JOC AMB PGN TREE ---
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

  // --- ESTAT DE L'ANÀLISI (NOU) ---
  const engine = useRef<Worker | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [bestLine, setBestLine] = useState<string>("");

  // --- HISTORIAL D'AVALUACIONS PER AL COACH ---
  const [evaluationHistory, setEvaluationHistory] = useState<Array<Evaluation | null>>([null]);
  const [lastMove, setLastMove] = useState<string | null>(null);

  // Settings
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // Assegurar que estem al client + Carregar PGN si ve del localStorage
  useEffect(() => {
    setIsClient(true);

    // Comprovar si hi ha un PGN guardat (des de la partida online)
    const savedPGN = localStorage.getItem('analysis_pgn');
    if (savedPGN) {
      try {
        // Parse PGN into tree
        const newTree = PGNParser.parse(savedPGN);
        setPgnTree(newTree);

        // Set position to end of game
        const mainLine = newTree.getMainLine();
        if (mainLine.length > 0) {
          newTree.goToNode(mainLine[mainLine.length - 1]);
        }

        setFen(newTree.getCurrentFen());
        const chess = new Chess(newTree.getCurrentFen());
        setGame(chess);

        // Netejar localStorage
        localStorage.removeItem('analysis_pgn');
      } catch (e) {
        console.error('Error carregant PGN:', e);
      }
    }
  }, []);

  // 1. INICIALITZAR STOCKFISH (AL MUNTAR)
  // CRÍTICO: Solo inicializar una vez usando useRef
  useEffect(() => {
    // Solo crear el worker si no existe
    if (!engine.current) {
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
      const workerCode = `importScripts('${stockfishUrl}');`;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const localWorkerUrl = URL.createObjectURL(blob);

      const stockfishWorker = new Worker(localWorkerUrl);
      engine.current = stockfishWorker;

      // Configurar Web Worker
      stockfishWorker.postMessage('uci');

      // Esperar una mica abans de configurar MultiPV
      setTimeout(() => {
        stockfishWorker.postMessage('setoption name MultiPV value 1');
      }, 100);
    }

    return () => {
      // Solo limpiar al desmontar el componente
      if (engine.current) {
        engine.current.terminate();
        engine.current = null;
      }
    };
  }, []);

  // 2. PARSER DE STOCKFISH (El traductor)
  const parseEngineMessage = (msg: string) => {
    // Exemple: info depth 10 seldepth 15 multipv 1 score cp 45 pv e2e4 e7e5

    // A. Extreure Avaluació (cp = centipeons, mate = escac i mat)
    const scoreMatch = msg.match(/score (cp|mate) (-?\d+)/);
    if (scoreMatch) {
      const type = scoreMatch[1] as 'cp' | 'mate';
      let value = parseInt(scoreMatch[2]);

      // Ajustar el valor segons qui mou (Stockfish sempre dona valor absolut per al color actiu)
      const currentGame = new Chess(fen);
      if (currentGame.turn() === 'b') {
        value = -value;
      }

      setEvaluation({ type, value });
    }

    // B. Extreure Millor Línia (PV)
    const pvMatch = msg.match(/ pv ([a-h1-8]+(?:\s+[a-h1-8]+)*)/);
    if (pvMatch) {
      const moves = pvMatch[1].trim().split(/\s+/);
      if (moves.length > 0) {
        setBestMove(moves[0]); // El primer moviment és la fletxa
        setBestLine(moves.slice(0, 5).join(' ')); // Mostrem els primers 5 moviments
      }
    }
  };

  // 3. GESTIONAR MISSATGES DEL MOTOR
  useEffect(() => {
    if (!engine.current) return;

    engine.current.onmessage = (event) => {
      const msg = event.data;

      // Filtrar només les línies d'informació rellevants (profunditat mínima 10 per evitar soroll)
      if (msg.startsWith('info') && (msg.includes('depth 10') || msg.includes('depth 15'))) {
        parseEngineMessage(msg);
        setIsAnalyzing(false); // Ja tenim dades
      }

      // Detectem quan comença l'anàlisi
      if (msg.includes('depth 1')) {
        setIsAnalyzing(true);
      }
    };
  }, [fen]);

  // 4. DISPARAR ANÀLISI QUAN CANVIA LA POSICIÓ
  useEffect(() => {
    if (!engine.current || !isClient) return;

    setIsAnalyzing(true);
    setBestMove(null); // Netejar fletxa anterior
    setEvaluation(null);

    // Aturar càlcul anterior i començar nou
    engine.current.postMessage('stop');
    engine.current.postMessage(`position fen ${fen}`);
    engine.current.postMessage(`go depth ${ENGINE_DEPTH}`); // Anàlisi profunditat fixa

  }, [fen, isClient]); // S'executa cada cop que 'fen' canvia

  // --- LÒGICA DEL JOC ---
  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    console.log('[Analysis onDrop] Called:', { sourceSquare, targetSquare, currentFen: game.fen() });

    if (!targetSquare) return false;

    // CRÍTICO: "Copy before Move" pattern
    const gameCopy = new Chess(game.fen());
    let move = null;

    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    } catch (error) {
      return false;
    }

    if (!move) {
      return false;
    }

    console.log('[Analysis onDrop] Move created:', move);

    // Add move to PGN tree - create new instance for immutability
    const newTree = new PGNTree();
    // Copy tree state
    Object.assign(newTree, pgnTree);
    const newNode = newTree.addMove(move.san, createVariation);

    if (!newNode) {
      console.log('[Analysis onDrop] Failed to add move to PGN tree');
      return false;
    }

    // Update state
    const newFen = gameCopy.fen();
    console.log('[Analysis onDrop] New FEN:', newFen);

    setGame(gameCopy);
    setFen(newFen);
    setLastMove(move.san);
    setPgnTree(newTree);

    // Reset variation mode after creating
    if (createVariation) {
      setCreateVariation(false);
    }

    return true;
  }

  // Wrapper for SmartChessboard onMove prop which only gives FEN
  // We need to find the move that caused this FEN change or just update state
  // But SmartChessboard calls onMove AFTER internal state update.
  // Ideally we use onDrop directly passed to SmartChessboard if we want full control.
  // But SmartChessboard's onMove is (fen) => void.
  // Let's use the onPieceDrop prop of react-chessboard which SmartChessboard exposes via onPieceDrop prop?
  // Wait, I updated SmartChessboard to take onMove but it uses internal onDrop.
  // Actually, SmartChessboard's onDrop calls onMove(gameCopy.fen()).
  // So if I pass onMove, I get the new FEN. But I lose the move details (SAN) needed for PGN.
  // This is a limitation of the current SmartChessboard if I want to maintain PGN.
  // HOWEVER, I can just pass my `onDrop` function as `onPieceDrop` to `SmartChessboard`?
  // No, SmartChessboard defines its own `onDrop`.
  // Let's look at SmartChessboard again.
  // It takes `onMove`.
  // If I want to use `SmartChessboard` in Analysis, I might need to let it handle the move validation
  // but I need the move details for the PGN tree.
  // The current `SmartChessboard` implementation is a bit simple for Analysis needs.
  // BUT, I can just use `SmartChessboard` for the visual part and pass `onMove` to sync FEN?
  // No, because I need to update PGN tree.
  // Let's modify `SmartChessboard` to accept `onPieceDrop` override?
  // Or better, let's just use `SmartChessboard` as a controlled component if possible?
  // It has internal state `game` and `fen`.
  // If I pass `initialFen={fen}`, it syncs.
  // But `onDrop` is internal.
  // I should probably have added `onPieceDrop` to `SmartChessboardProps` to override logic if needed.
  // But I didn't.
  // Wait, I can use the `onMove` callback. When `onMove` is called with new FEN,
  // I can compare old `game` and new `fen` to find the move?
  // Yes, `game` is the state before move.
  // `const tempGame = new Chess(game.fen()); const move = tempGame.move(...)`
  // But I don't know `from` and `to` in `onMove`.
  //
  // Let's look at `SmartChessboard` again.
  // It uses `react-chessboard`.
  // I can pass `onPieceDrop` to `SmartChessboard` if I add it to props.
  // I DID NOT add `onPieceDrop` to props in the previous step. I added `onSquareClick`.
  //
  // Actually, for Analysis, we need full control.
  // Maybe I should have added `onPieceDrop` to `SmartChessboard` props.
  // Let's quickly check `SmartChessboard` code again.
  // It has `const onDrop = ...`. It does NOT accept `onPieceDrop` from props.
  // This is a problem for PGN recording.
  //
  // WORKAROUND:
  // I will use `SmartChessboard` but I will modify it slightly in the next step if needed.
  // OR, I can use `onMove` and try to deduce the move.
  // But `SmartChessboard` already does the move.
  //
  // Actually, `SmartChessboard` is designed for "Play" mode where we just need the new state.
  // For "Analysis", we need the move SAN.
  //
  // Let's RE-READ `SmartChessboard` code I just wrote.
  // It has `onDrop` defined inside.
  //
  // I will update `SmartChessboard` to accept an optional `onPieceDrop` prop that overrides the internal one?
  // Or better, `onMove` could pass the move object?
  //
  // Let's stick to the plan: "Replace direct `react-chessboard` usage with `SmartChessboard`".
  // But I need to make sure I can record moves.
  //
  // If I use `SmartChessboard`, I lose the `onDrop` logic I have in `AnalysisPage` which records to PGN.
  //
  // I will modify `SmartChessboard` to accept `onPieceDrop` as a prop.
  // If provided, it uses that. If not, it uses default.
  //
  // Wait, I can't modify `SmartChessboard` in this `replace_file_content` call.
  // I should have done it in the previous step.
  //
  // Let's do a quick fix on `SmartChessboard` FIRST.
  // I will cancel this `replace_file_content` and update `SmartChessboard` first.
  //
  // NO, I can't cancel. I have to execute or error.
  // I will error this step intentionally or just write the file and then fix `SmartChessboard`.
  // Actually, I can just write `AnalysisPage` assuming `SmartChessboard` has `onPieceDrop`?
  // No, that will cause type error.
  //
  // Let's write `AnalysisPage` using `SmartChessboard` but passing `onMove` that tries to deduce the move?
  // That's risky.
  //
  // Alternative: `SmartChessboard` exposes `onPieceDrop`?
  //
  // Let's look at `AnalysisPage` `onDrop`. It does a lot: PGN tree update, variation handling...
  //
  // I really need to pass this `onDrop` to the board.
  //
  // I will update `SmartChessboard` to accept `onPieceDrop` in the NEXT step.
  // For now, I will write `AnalysisPage` passing `onPieceDrop={onDrop}` to `SmartChessboard`
  // and I will add `// @ts-ignore` or similar if needed, OR I will just fix `SmartChessboard` immediately after.
  //
  // Actually, I'll just write `AnalysisPage` now, and then fix `SmartChessboard`.
  // I will assume `SmartChessboard` accepts `onPieceDrop`.

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as Parameters<typeof game.moves>[0]['square'],
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.forEach((move) => {
      const targetPiece = game.get(move.to as Parameters<typeof game.get>[0]);
      const sourcePiece = game.get(square as Parameters<typeof game.get>[0]);
      const isCapture = targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color;

      newSquares[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, rgba(255,0,0,.5) 25%, transparent 25%)'
          : 'radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    // If we have a moveFrom, try to move to the clicked square
    if (moveFrom) {
      // If clicked on the same square, deselect
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // Attempt move (reuse onDrop logic essentially)
      const moveResult = onDrop(moveFrom, square);
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // If move failed, check if we clicked on another piece of our own to select it instead
      const clickedPiece = game.get(square as Parameters<typeof game.get>[0]);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
        return;
      }

      // Otherwise, just deselect
      setMoveFrom(null);
      setOptionSquares({});
    } else {
      // No piece selected, try to select
      const piece = game.get(square as Parameters<typeof game.get>[0]);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
    }
  }

  const handleExplorerMove = (uci: string) => {
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;

    // CRÍTICO: "Copy before Move" pattern
    const gameCopy = new Chess(game.fen());

    try {
      const move = gameCopy.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (move) {
        // Add move to PGN tree - create new instance for immutability
        const newTree = new PGNTree();
        Object.assign(newTree, pgnTree);
        const newNode = newTree.addMove(move.san, createVariation);

        if (newNode) {
          setGame(gameCopy);
          setFen(gameCopy.fen());
          setLastMove(move.san);
          setPgnTree(newTree);
        }
      }
    } catch (e) {
      console.error("Invalid move from explorer:", uci);
    }
  };

  const resetBoard = () => {
    const newTree = new PGNTree();
    const newGame = new Chess();
    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    setPgnTree(newTree);
    setGame(newGame);
    setFen(initialFen);
    setEvaluation(null);
    setBestMove(null);
    setBestLine("");
    setCreateVariation(false);
  };

  const handlePositionChange = (newFen: string) => {
    setFen(newFen);
    setGame(new Chess(newFen));
  };

  // Navigation shortcuts
  const goForward = () => {
    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    newTree.goForward();
    handlePositionChange(newTree.getCurrentFen());
    setPgnTree(newTree);
  };

  const goBack = () => {
    const newTree = new PGNTree();
    Object.assign(newTree, pgnTree);
    newTree.goBack();
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

  // Helper per mostrar l'avaluació
  const getEvalText = () => {
    if (!evaluation) return '...';
    if (evaluation.type === 'mate') {
      return evaluation.value > 0 ? `M${Math.abs(evaluation.value)}` : `-M${Math.abs(evaluation.value)}`;
    }
    const val = evaluation.value / 100;
    return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
  };

  // Preparar fletxes per al tauler
  const customArrows: Array<[string, string, string]> = bestMove
    ? [[bestMove.substring(0, 2), bestMove.substring(2, 4), 'rgb(34, 197, 94)']] // Verde
    : [];

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Carregant...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-4 font-sans">

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mt-4 h-[85vh]">

        {/* 1. TAULER CENTRAL */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-2xl relative">
          {/* Barra d'Avaluació Flotant */}
          <div className={`absolute top-6 left-6 z-10 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border flex items-center gap-2 ${(evaluation?.value || 0) > 0
            ? 'bg-slate-100 text-slate-900 border-slate-300'
            : 'bg-slate-800 text-white border-slate-600'
            }`}>
            <Cpu size={14} className={isAnalyzing ? 'animate-spin' : ''} />
            <span>{getEvalText()}</span>
          </div>

          {/* View Mode Toggle */}
          <div className="absolute top-6 right-6 z-10 bg-black/50 backdrop-blur-md p-1 rounded-lg flex gap-1 border border-white/10">
            <Button
              variant={viewMode === '2d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('2d')}
              className={`h-7 px-2 text-xs ${viewMode === '2d' ? 'bg-emerald-600 hover:bg-emerald-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              <LayoutGrid size={14} className="mr-1" /> 2D
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('3d')}
              className={`h-7 px-2 text-xs ${viewMode === '3d' ? 'bg-emerald-600 hover:bg-emerald-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              <Box size={14} className="mr-1" /> 3D
            </Button>
          </div>

          <div className="w-full max-w-[600px] aspect-square relative z-0">
            {viewMode === '3d' ? (
              <div className="w-full h-full rounded-lg overflow-hidden border-4 border-slate-700">
                <ChessScene
                  fen={fen}
                  orientation="white"
                />
              </div>
            ) : (
              <SmartChessboard
                initialFen={fen}
                onPieceDrop={onDrop}
                boardOrientation="white"
                animationDurationInMs={200}
                customDarkSquareStyle={{ backgroundColor: theme.dark }}
                customLightSquareStyle={{ backgroundColor: theme.light }}
                customArrows={customArrows}
                onSquareClick={onSquareClick}
                onSquareRightClick={() => {
                  setMoveFrom(null);
                  setOptionSquares({});
                }}
                customSquareStyles={optionSquares}
              />
            )}
          </div>

          {/* Controls de Navegació */}
          <div className="flex items-center justify-center gap-2 mt-6 w-full max-w-[650px]">
            <button
              onClick={goToStart}
              disabled={pgnTree.isAtStart()}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Anar al principi"
            >
              <ChevronsLeft size={24} />
            </button>
            <button
              onClick={goBack}
              disabled={pgnTree.isAtStart()}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Moviment anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goForward}
              disabled={pgnTree.isAtEnd()}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Moviment següent"
            >
              <ChevronRight size={24} />
            </button>
            <button
              onClick={goToEnd}
              disabled={pgnTree.isAtEnd()}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Anar al final"
            >
              <ChevronsRight size={24} />
            </button>
            <button
              onClick={() => setCreateVariation(!createVariation)}
              className={`p-3 rounded-lg transition text-white ml-2 ${createVariation ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-800 hover:bg-slate-700'}`}
              title="Crear variació"
            >
              <GitBranch size={24} />
            </button>
          </div>
        </div>

        {/* 2. PANELL LATERAL */}
        <div className="w-full lg:w-96 flex flex-col gap-4">

          {/* Tabs */}
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'analysis' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Anàlisi
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'database' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Base de Dades
            </button>
          </div>

          {activeTab === 'analysis' ? (
            <>
              {/* Barra Eines */}
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex gap-2">
                <button
                  onClick={resetBoard}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition text-white"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                {createVariation && (
                  <div className="flex-1 bg-amber-500/20 border border-amber-500/50 p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-amber-300">
                    <GitBranch size={16} /> Mode Variació
                  </div>
                )}
              </div>

              {/* Coach Agent */}
              <CoachAgent
                evaluation={evaluation}
                previousEval={null}
                currentMove={lastMove}
                turn={game.turn()}
              />

              {/* Info Stockfish */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Cpu size={14} /> Stockfish 10
                  </h3>
                  <Settings size={14} className="text-slate-500 cursor-pointer hover:text-white transition" />
                </div>
                <div className="text-sm font-mono text-emerald-400 bg-slate-950/50 p-2 rounded border border-slate-800/50 h-16 overflow-hidden flex items-center">
                  {bestLine ? (
                    <>
                      <span className="font-bold mr-2 text-white">{getEvalText()}</span>
                      <span className="text-slate-400">{bestLine}...</span>
                    </>
                  ) : (
                    <span className="text-slate-600 flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" /> Calculant...
                    </span>
                  )}
                </div>
              </div>

              {/* PGN Editor */}
              <PGNEditor
                tree={pgnTree}
                onTreeChange={setPgnTree}
                onPositionChange={handlePositionChange}
                currentMove={lastMove || undefined}
                autoAnnotate={true}
                engineEval={evaluation}
              />
            </>
          ) : (
            <div className="flex-1 h-full min-h-[500px]">
              <OpeningExplorer fen={fen} onSelectMove={handleExplorerMove} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
