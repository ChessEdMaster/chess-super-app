'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';
import { Flag, Handshake, X, RotateCw, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChessClock } from '@/components/chess/chess-clock';
import { ChatBox } from '@/components/chat-box';
import { MoveHistory } from '@/components/chess/move-history';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { useChessEngine } from '@/hooks/use-chess-engine';
import { usePlayerStore } from '@/lib/store/player-store';
import { useRouter } from 'next/navigation';

interface OnlineGameViewProps {
    gameId: string;
    user: any;
    onExit?: () => void;
}

interface GameData {
    id: string;
    white_player_id: string | null;
    black_player_id: string | null;
    fen: string;
    pgn: string;
    status: 'pending' | 'active' | 'finished';
    result?: string;
    white_time?: number;
    black_time?: number;
    draw_offer_by?: string | null;
    rematch_status?: { white: boolean; black: boolean; next_game_id?: string | null };
    white?: { username: string; avatar_url?: string };
    black?: { username: string; avatar_url?: string };
    last_move_at?: string;
    created_at?: string;
}

export function OnlineGameView({ gameId, user, onExit }: OnlineGameViewProps) {
    const router = useRouter();
    const { addXp, addGold, addChest } = usePlayerStore();
    const { fen, makeMove, setGameFromFen, game } = useChessEngine();

    const [gameData, setGameData] = useState<GameData | null>(null);
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [status, setStatus] = useState('Carregant...');
    const [players, setPlayers] = useState({ white: '...', black: '...' });
    const [drawOffer, setDrawOffer] = useState<string | null>(null);
    const [moveFrom, setMoveFrom] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

    const { boardTheme } = useSettings();
    const theme = BOARD_THEMES[boardTheme];

    useEffect(() => {
        if (!gameId || !user) return;

        const fetchAndSubscribe = async () => {
            let initialGame = null;

            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', gameId)
                .single();

            if (error || !data) {
                toast.error("Partida no trobada");
                onExit?.();
                return;
            }
            initialGame = data;

            // Determine color
            let myColor: 'white' | 'black' | null = null;
            if (initialGame.white_player_id === user.id) myColor = 'white';
            else if (initialGame.black_player_id === user.id) myColor = 'black';

            if (myColor) setOrientation(myColor);

            // Fetch profiles
            const whiteP = initialGame.white_player_id ? await supabase.from('profiles').select('username, avatar_url').eq('id', initialGame.white_player_id).single() : null;
            const blackP = initialGame.black_player_id ? await supabase.from('profiles').select('username, avatar_url').eq('id', initialGame.black_player_id).single() : null;

            initialGame.white = whiteP?.data;
            initialGame.black = blackP?.data;

            setGameData(initialGame);
            setPlayers({
                white: initialGame.white?.username || 'Jugador 1',
                black: initialGame.black?.username || 'Esperant rival...'
            });

            const startFen = initialGame.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            setGameFromFen(startFen);
            updateStatusDisplay(new Chess(startFen), initialGame);

            // Realtime
            const channel = supabase
                .channel(`game_view_${gameId}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, async (payload) => {
                    console.log("Realtime (Postgres) update received:", payload);
                    const fresh = payload.new as GameData;

                    // Only update if it's not a redundant update (already handled by broadcast)
                    // or if it's the opponent's move.
                    syncGame(fresh);
                })
                .on('broadcast', { event: 'move' }, (payload) => {
                    console.log("Realtime (Broadcast) move received:", payload);
                    const { fen: newFen, gameData: freshData } = payload.payload;
                    setGameFromFen(newFen);
                    syncGame(freshData);
                    playSound('move');
                })
                .subscribe((status) => {
                    console.log(`Realtime status for game ${gameId}:`, status);
                    if (status === 'CHANNEL_ERROR') {
                        toast.error("Error de connexió en temps real. Prova de recarregar.");
                    }
                });

            // Helper to sync data
            const syncGame = async (fresh: GameData) => {
                if (fresh.white_player_id) {
                    const p = await supabase.from('profiles').select('username, avatar_url').eq('id', fresh.white_player_id).single();
                    fresh.white = p.data || undefined;
                }
                if (fresh.black_player_id) {
                    const p = await supabase.from('profiles').select('username, avatar_url').eq('id', fresh.black_player_id).single();
                    fresh.black = p.data || undefined;
                }

                const incomeGame = new Chess(fresh.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

                setGameFromFen(fresh.fen);
                setGameData(prev => {
                    // Evitar "backwards" updates si el broadcast ha anat més ràpid
                    if (prev && prev.last_move_at && fresh.last_move_at) {
                        if (new Date(fresh.last_move_at) < new Date(prev.last_move_at)) return prev;
                    }
                    return fresh;
                });
                setDrawOffer(fresh.draw_offer_by || null);
                setPlayers({
                    white: fresh.white?.username || 'Jugador 1',
                    black: fresh.black?.username || (fresh.black_player_id ? 'Jugador 2' : 'Esperant rival...')
                });
                updateStatusDisplay(incomeGame, fresh);
            };

            return () => { supabase.removeChannel(channel); };
        };

        fetchAndSubscribe();
    }, [gameId, user]);

    function updateStatusDisplay(chessInstance: Chess, dbData: any) {
        if (dbData.status === 'pending') {
            setStatus("Esperant que s'uneixi un rival...");
        } else if (dbData.status === 'finished') {
            if (dbData.result === '1/2-1/2') setStatus("Partida Finalitzada: Taules");
            else if (dbData.result === '1-0') setStatus("Partida Finalitzada: Guanyen Blanques");
            else if (dbData.result === '0-1') setStatus("Partida Finalitzada: Guanyen Negres");
            else setStatus("Partida Finalitzada");
        } else {
            const turn = chessInstance.turn() === 'w' ? 'Blanques' : 'Negres';
            setStatus(`Torn de les ${turn}`);
        }
    }

    const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
        if (!gameData || gameData.status !== 'active' || game.isGameOver()) return false;
        if (game.turn() === 'w' && orientation === 'black') return false;
        if (game.turn() === 'b' && orientation === 'white') return false;

        const turn = game.turn(); // Turn before the move
        const move = makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
        if (!move) return false;

        const newFen = game.fen();
        const now = new Date();
        const lastMoveAt = gameData.last_move_at ? new Date(gameData.last_move_at) : new Date(gameData.created_at || now);
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - lastMoveAt.getTime()) / 1000));

        const updatedData: GameData = {
            ...gameData,
            fen: newFen,
            pgn: game.pgn(),
            last_move_at: now.toISOString(),
            white_time: turn === 'w' ? Math.max(0, (gameData.white_time || 600) - diffSeconds) : gameData.white_time,
            black_time: turn === 'b' ? Math.max(0, (gameData.black_time || 600) - diffSeconds) : gameData.black_time,
        };

        // 1. Update local state immediately for zero-perceived lag
        setGameData(updatedData);

        // 2. Broadcast move to opponent (Instant)
        supabase.channel(`game_view_${gameId}`).send({
            type: 'broadcast',
            event: 'move',
            payload: { move, fen: newFen, gameData: updatedData }
        });

        // 3. Persist to DB
        supabase.from('games').update({
            fen: updatedData.fen,
            pgn: updatedData.pgn,
            last_move_at: updatedData.last_move_at,
            white_time: updatedData.white_time,
            black_time: updatedData.black_time
        }).eq('id', gameId).then(({ error }) => {
            if (error) console.error("Error updating move:", error);
        });

        playSound('move');
        return true;
    };

    const getMoveOptions = (square: string) => {
        const moves = game.moves({ square: square as any, verbose: true });
        if (moves.length === 0) {
            setOptionSquares({});
            return;
        }

        const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
        moves.forEach((move) => {
            const targetPiece = game.get(move.to as any);
            const isCapture = targetPiece && targetPiece.color !== game.turn();
            newSquares[move.to] = {
                background: isCapture ? 'radial-gradient(circle, rgba(255,0,0,.5) 25%, transparent 25%)' : 'radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)',
                borderRadius: '50%',
            };
        });
        newSquares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
        setOptionSquares(newSquares);
    };

    const onSquareClick = (square: string) => {
        if (gameData?.status !== 'active' || game.isGameOver()) return;
        if (game.turn() === 'w' && orientation === 'black') return;
        if (game.turn() === 'b' && orientation === 'white') return;

        if (moveFrom) {
            if (moveFrom === square) {
                setMoveFrom(null);
                setOptionSquares({});
                return;
            }
            if (onDrop(moveFrom, square)) {
                setMoveFrom(null);
                setOptionSquares({});
                return;
            }
            const piece = game.get(square as any);
            if (piece && piece.color === game.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
            } else {
                setMoveFrom(null);
                setOptionSquares({});
            }
        } else {
            const piece = game.get(square as any);
            if (piece && piece.color === game.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
            }
        }
    };

    const handleResign = async () => {
        if (!confirm("Rendir-se?")) return;
        const res = orientation === 'white' ? '0-1' : '1-0';
        await supabase.from('games').update({ status: 'finished', result: res }).eq('id', gameId);
    };

    const handleOfferDraw = async () => {
        if (drawOffer === orientation) return;
        await supabase.from('games').update({ draw_offer_by: orientation }).eq('id', gameId);
    };

    const handleAcceptDraw = async () => {
        await supabase.from('games').update({ status: 'finished', result: '1/2-1/2', draw_offer_by: null }).eq('id', gameId);
    };

    const handleDeclineDraw = async () => {
        await supabase.from('games').update({ draw_offer_by: null }).eq('id', gameId);
    };

    const handleRematch = async () => {
        // Logic similar to online/[id]/page.tsx
        toast.info("Rematch logic coming soon...");
    };

    if (!gameData) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-4">
            {/* Left: Board */}
            <div className="flex-1 flex flex-col gap-4">
                <ChessClock
                    whiteTime={gameData.white_time || 600}
                    blackTime={gameData.black_time || 600}
                    turn={game.turn()}
                    isActive={gameData.status === 'active'}
                    lastMoveAt={gameData.last_move_at}
                    onTimeout={(w) => supabase.from('games').update({ status: 'finished', result: w === 'w' ? '1-0' : '0-1' }).eq('id', gameId)}
                />

                <div className="relative aspect-square w-full max-w-[600px] mx-auto bg-black/20 rounded-xl overflow-hidden shadow-2xl">
                    <Chessboard2D
                        fen={fen}
                        orientation={orientation}
                        onSquareClick={onSquareClick}
                        customSquareStyles={optionSquares}
                    />
                    {gameData.status === 'pending' && (
                        <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="animate-spin text-amber-400 mb-4 mx-auto" size={40} />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Esperant Rival...</h3>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleResign} disabled={gameData.status !== 'active'} className="bg-slate-800 text-zinc-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-900/30 hover:text-red-400 transition-all border border-slate-700">
                        <Flag size={14} /> Abandonar
                    </button>

                    {drawOffer && drawOffer !== orientation ? (
                        <div className="flex gap-2">
                            <button onClick={handleAcceptDraw} className="flex-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                                Acceptar Taules
                            </button>
                            <button onClick={handleDeclineDraw} className="w-12 bg-slate-800 text-red-400 rounded-lg flex items-center justify-center">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleOfferDraw} disabled={gameData.status !== 'active' || !!drawOffer} className="bg-slate-800 text-zinc-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-slate-700">
                            <Handshake size={14} /> Oferir Taules
                        </button>
                    )}
                </div>
            </div>

            {/* Right: Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${orientation === 'white' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'}`}>
                        {orientation === 'white' ? 'B' : 'W'}
                    </div>
                    <div>
                        <p className="font-bold text-white text-lg">{orientation === 'white' ? players.black : players.white}</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Rival</p>
                    </div>
                </div>

                <div className="flex-1">
                    <MoveHistory history={game.history()} />
                </div>

                <div className="h-48">
                    <ChatBox gameId={gameId} userId={user.id} />
                </div>

                {gameData.status === 'finished' && (
                    <div className="space-y-3">
                        <button onClick={handleRematch} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                            <RotateCw size={18} /> Revenja
                        </button>
                        <button onClick={() => { localStorage.setItem('analysis_pgn', game.pgn()); router.push('/analysis'); }} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700">
                            <Search size={18} /> Analitzar
                        </button>
                        <button onClick={onExit} className="w-full text-zinc-500 hover:text-zinc-300 py-2 text-xs transition uppercase tracking-widest">
                            Tornar al Lobby
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
