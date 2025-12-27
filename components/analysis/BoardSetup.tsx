'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, Trash2, Check, ArrowRight } from 'lucide-react';
import { Chess } from 'chess.js';
import { Separator } from '@/components/ui/separator';

import Chessboard2D from '@/components/2d/Chessboard2D';

interface BoardSetupProps {
    fen: string;
    onFenChange: (fen: string) => void;
    selectedPiece: string | null;
    onSelectPiece: (piece: string | null) => void;
    onClear: () => void;
    onReset: () => void;
    onStartAnalysis: () => void;
}

const PIECES = [
    'wP', 'wN', 'wB', 'wR', 'wQ', 'wK',
    'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'
];

export const BoardSetup = ({
    fen,
    onFenChange,
    selectedPiece,
    onSelectPiece,
    onClear,
    onReset,
    onStartAnalysis
}: BoardSetupProps) => {
    const [fenInput, setFenInput] = useState(fen);

    // Sync internal input state with prop if prop changes externally (reset/clear/etc)
    React.useEffect(() => {
        setFenInput(fen);
    }, [fen]);


    const handleFenSubmit = () => {
        try {
            const g = new Chess(fenInput);
            onFenChange(g.fen());
        } catch (e) {
            // Invalid FEN
        }
    };

    const updateRights = (color: 'w' | 'b', type: 'OO' | 'OOO', allowed: boolean) => {
        // This is tricky with chess.js immutable structure or fen manipulation
        // Simplest is to parse FEN, modify castling part, rebuild.
        // FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
        // Parts: [board, turn, castle, enpassant, half, full]
        const parts = fen.split(' ');
        let castle = parts[2];

        const char = color === 'w' ? (type === 'OO' ? 'K' : 'Q') : (type === 'OO' ? 'k' : 'q');

        if (allowed) {
            if (!castle.includes(char)) {
                if (castle === '-') castle = char;
                else castle += char;
            }
        } else {
            castle = castle.replace(char, '');
            if (castle === '') castle = '-';
        }

        const newFen = `${parts[0]} ${parts[1]} ${castle} ${parts[3]} ${parts[4]} ${parts[5]}`;
        onFenChange(newFen);
    };

    const toggleTurn = () => {
        const parts = fen.split(' ');
        parts[1] = parts[1] === 'w' ? 'b' : 'w';
        onFenChange(parts.join(' '));
    };

    const getCastleRight = (color: 'w' | 'b', type: 'OO' | 'OOO') => {
        const castle = fen.split(' ')[2];
        const char = color === 'w' ? (type === 'OO' ? 'K' : 'Q') : (type === 'OO' ? 'k' : 'q');
        return castle.includes(char);
    };

    const getTurn = () => fen.split(' ')[1];

    const handleSquareClick = (square: string) => {
        if (!selectedPiece) return;

        const parts = fen.split(' ');
        const board = parts[0];
        const rows = board.split('/');

        const col = square.charCodeAt(0) - 97;
        const row = 8 - parseInt(square[1]);

        // Reconstruct board with new piece
        const boardMatrix: (string | null)[][] = rows.map(r => {
            const rowArr: (string | null)[] = [];
            for (let char of r) {
                if (char >= '1' && char <= '8') {
                    for (let k = 0; k < parseInt(char); k++) rowArr.push(null);
                } else {
                    rowArr.push(char);
                }
            }
            return rowArr;
        });

        if (selectedPiece === 'trash') {
            boardMatrix[row][col] = null;
        } else {
            // selectedPiece is like 'wP', 'bN'
            const pieceChar = selectedPiece[1].toLowerCase();
            const finalChar = selectedPiece[0] === 'w' ? pieceChar.toUpperCase() : pieceChar;
            boardMatrix[row][col] = finalChar;
        }

        // Back to FEN
        const newBoardFen = boardMatrix.map(r => {
            let res = '';
            let empty = 0;
            for (let cell of r) {
                if (cell === null) empty++;
                else {
                    if (empty > 0) { res += empty; empty = 0; }
                    res += cell;
                }
            }
            if (empty > 0) res += empty;
            return res;
        }).join('/');

        const newFen = `${newBoardFen} ${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]} ${parts[5]}`;
        onFenChange(newFen);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 font-sans">
            <div className="p-4 space-y-6">

                {/* PREVIEW BOARD */}
                <div className="aspect-square w-full max-w-[300px] mx-auto bg-zinc-800 rounded-xl overflow-hidden border-4 border-zinc-700">
                    <Chessboard2D
                        fen={fen}
                        onSquareClick={handleSquareClick}
                        customSquareStyles={selectedPiece ? {
                            // Add a visual hint if needed
                        } : {}}
                    />
                </div>

                {/* PIECE PALETTE */}
                <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 text-center">Tria una peça i clica al tauler</h3>
                    <div className="grid grid-cols-6 gap-2">
                        {PIECES.map((p) => (
                            <button
                                key={p}
                                onClick={() => onSelectPiece(selectedPiece === p ? null : p)}
                                className={`aspect-square rounded-lg flex items-center justify-center transition-all ${selectedPiece === p
                                    ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110 z-10'
                                    : 'bg-zinc-800 hover:bg-zinc-700'
                                    }`}
                            >
                                <img
                                    src={`https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${p}.png`}
                                    alt={p}
                                    className="w-10 h-10"
                                />
                            </button>
                        ))}
                        <button
                            onClick={() => onSelectPiece(selectedPiece === 'trash' ? null : 'trash')}
                            className={`aspect-square rounded-lg flex items-center justify-center transition-all ${selectedPiece === 'trash'
                                ? 'bg-rose-600 ring-2 ring-rose-400 scale-110 z-10'
                                : 'bg-zinc-800 hover:bg-rose-900/50 hover:text-rose-500'
                                }`}
                        >
                            <Trash2 size={24} />
                        </button>
                    </div>
                </div>

                <Separator className="bg-zinc-800" />

                {/* SETTINGS */}
                <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Configuració</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Turn */}
                        <div className="space-y-2">
                            <span className="text-sm text-zinc-400">Torn</span>
                            <div className="flex bg-zinc-800 rounded-lg p-1">
                                <button
                                    onClick={() => getTurn() !== 'w' && toggleTurn()}
                                    className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${getTurn() === 'w' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Blanc
                                </button>
                                <button
                                    onClick={() => getTurn() !== 'b' && toggleTurn()}
                                    className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${getTurn() === 'b' ? 'bg-zinc-950 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Negre
                                </button>
                            </div>
                        </div>

                        {/* Castling */}
                        <div className="space-y-1">
                            <span className="text-sm text-zinc-400">Enrocs</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={getCastleRight('w', 'OO')} onChange={(e) => updateRights('w', 'OO', e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" /> W O-O
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={getCastleRight('w', 'OOO')} onChange={(e) => updateRights('w', 'OOO', e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" /> W O-O-O
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={getCastleRight('b', 'OO')} onChange={(e) => updateRights('b', 'OO', e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" /> B O-O
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={getCastleRight('b', 'OOO')} onChange={(e) => updateRights('b', 'OOO', e.target.checked)} className="rounded bg-zinc-800 border-zinc-700" /> B O-O-O
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-zinc-800" />

                {/* FEN */}
                <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">FEN</h3>
                    <div className="flex gap-2">
                        <Textarea
                            value={fenInput}
                            onChange={(e) => setFenInput(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-xs font-mono resize-none h-16"
                        />
                        <Button size="icon" variant="secondary" className="h-16 w-16 shrink-0" onClick={handleFenSubmit}>
                            <Check className="text-emerald-500" />
                        </Button>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onReset} className="border-zinc-700 hover:bg-zinc-800">
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button variant="outline" onClick={onClear} className="border-zinc-700 hover:bg-zinc-800 hover:text-rose-500">
                        <Trash2 className="mr-2 h-4 w-4" /> Buidar
                    </Button>
                </div>
            </div>

            {/* START ANALYSIS BUTTON (Fixed at bottom) */}
            <div className="mt-auto p-4 border-t border-zinc-800 bg-zinc-900">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={onStartAnalysis}>
                    Començar Anàlisi <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
