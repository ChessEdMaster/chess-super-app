'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
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
  GitBranch
} from 'lucide-react';
import { CoachAgent } from '@/components/coach-agent';
import { PGNEditor } from '@/components/pgn-editor';
import { OpeningExplorer } from '@/components/analysis/opening-explorer';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { PGNTree } from '@/lib/pgn-tree';
import { PGNParser } from '@/lib/pgn-parser';
import type { Evaluation } from '@/lib/pgn-types';

// Configuració del Motor
const ENGINE_DEPTH = 15; // Profunditat d'anàlisi (15 és ràpid i fort)

export default function AnalysisPage() {
  // --- ESTAT DEL JOC AMB PGN TREE ---
  const [pgnTree, setPgnTree] = useState<PGNTree>(() => new PGNTree());
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isClient, setIsClient] = useState(false);
  const [createVariation, setCreateVariation] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'database'>('analysis');

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
  useEffect(() => {
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

    return () => {
      stockfishWorker.terminate();
      URL.revokeObjectURL(localWorkerUrl);
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
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare) return false;

    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (!move) return false;

      // Add move to PGN tree
      const newNode = pgnTree.addMove(move.san, createVariation);
      if (!newNode) return false;

      setGame(gameCopy);
      setFen(gameCopy.fen());
      setLastMove(move.san);
      setPgnTree(pgnTree); // Trigger re-render

      // Reset variation mode after creating
      if (createVariation) {
        setCreateVariation(false);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  const handleExplorerMove = (uci: string) => {
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;

    // Check if move is valid
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (move) {
        // Add move to PGN tree
        const newNode = pgnTree.addMove(move.san, createVariation);
        if (newNode) {
          setGame(gameCopy);
          setFen(gameCopy.fen());
          setLastMove(move.san);
          setPgnTree(pgnTree);
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
    pgnTree.goForward();
    handlePositionChange(pgnTree.getCurrentFen());
    setPgnTree(pgnTree);
  };

  const goBack = () => {
    pgnTree.goBack();
    handlePositionChange(pgnTree.getCurrentFen());
    setPgnTree(pgnTree);
  };

  const goToStart = () => {
    pgnTree.reset();
    handlePositionChange(pgnTree.getCurrentFen());
    setPgnTree(pgnTree);
  };

  const goToEnd = () => {
    const mainLine = pgnTree.getMainLine();
    if (mainLine.length > 0) {
      pgnTree.goToNode(mainLine[mainLine.length - 1]);
      handlePositionChange(pgnTree.getCurrentFen());
      setPgnTree(pgnTree);
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

          <div className="w-full max-w-[650px] aspect-square">
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation="white"
              animationDurationInMs={200}
              customDarkSquareStyle={{ backgroundColor: theme.dark }}
              customLightSquareStyle={{ backgroundColor: theme.light }}
              customArrows={bestMove ? [[bestMove.substring(0, 2), bestMove.substring(2, 4), 'rgb(0, 128, 0)']] : []}
            />
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
