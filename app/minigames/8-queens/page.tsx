'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function EightQueensPage() {
    // 8x8 Board. State is array of 8 numbers (column index for queen at that row), or null.
    // Index = Row (0-7), Value = Col (0-7)
    const [queens, setQueens] = useState<(number | null)[]>(Array(8).fill(null));

    const handleSquareClick = (row: number, col: number) => {
        const newQueens = [...queens];

        // If clicking existing queen, remove it
        if (newQueens[row] === col) {
            newQueens[row] = null;
        } else {
            // Place queen in this row (replace if exists)
            newQueens[row] = col;
        }

        setQueens(newQueens);
        checkWin(newQueens);
    };

    const checkWin = (currentQueens: (number | null)[]) => {
        // Must have 8 queens
        if (currentQueens.some(q => q === null)) return;

        // Check conflicts
        let conflict = false;
        for (let r1 = 0; r1 < 8; r1++) {
            for (let r2 = r1 + 1; r2 < 8; r2++) {
                const c1 = currentQueens[r1]!;
                const c2 = currentQueens[r2]!;

                // Same column (impossible by data structure, but good to note)
                if (c1 === c2) conflict = true;

                // Diagonals
                if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) conflict = true;
            }
        }

        if (!conflict) {
            toast.success("FELICITATS! Has resolt el problema de les 8 Dames!");
        }
    };

    const reset = () => setQueens(Array(8).fill(null));

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-12 text-white font-sans">
            <Link href="/minigames" className="absolute top-8 left-8">
                <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    <ArrowLeft className="mr-2" /> Tornar
                </Button>
            </Link>

            <h1 className="text-3xl font-black italic mb-2 flex items-center gap-3">
                <Trophy className="text-pink-500" /> REPTE 8 DAMES
            </h1>
            <p className="text-zinc-400 mb-8 text-center max-w-md">
                Col·loca 8 dames al tauler sense que s'amenacin entre elles.
                <br />
                <span className="text-xs opacity-50">(Cap dama pot compartir fila, columna o diagonal)</span>
            </p>

            <div className="bg-zinc-900 p-2 rounded-lg shadow-2xl border border-zinc-800">
                <div className="grid grid-cols-8 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px]">
                    {Array.from({ length: 8 }).map((_, row) =>
                        Array.from({ length: 8 }).map((_, col) => {
                            const isBlack = (row + col) % 2 === 1;
                            const hasQueen = queens[row] === col;

                            // Check if this square is threatened (visual helper - optional)
                            // For simplicity, just the board and queens first.

                            return (
                                <div
                                    key={`${row}-${col}`}
                                    onClick={() => handleSquareClick(row, col)}
                                    className={`
                                        flex items-center justify-center cursor-pointer transition-colors relative
                                        ${isBlack ? 'bg-zinc-700' : 'bg-zinc-300'}
                                        hover:opacity-90
                                    `}
                                >
                                    {hasQueen && (
                                        <div className="text-4xl sm:text-5xl drop-shadow-lg select-none">
                                            ♕
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <Button variant="outline" onClick={reset} className="border-zinc-700 hover:bg-zinc-800">
                    <RotateCcw className="mr-2" size={16} /> Reiniciar
                </Button>
            </div>
        </div>
    );
}
