'use client';

import React from 'react';
import { MoveNode } from '@/types/pgn';

interface MoveHistoryProps {
    mainLine: MoveNode[];
    currentNode: MoveNode | null;
    onGoToNode: (node: MoveNode | null) => void;
}

export function MoveHistory({ mainLine, currentNode, onGoToNode }: MoveHistoryProps) {
    if (!mainLine || mainLine.length === 0) {
        return (
            <div className="p-4 text-center text-zinc-500 text-xs italic">
                No moves played yet.
            </div>
        );
    }

    // Group moves into pairs (white, black)
    const movePairs: { moveNumber: number; white: MoveNode; black?: MoveNode }[] = [];

    // Iterate through mainline. Note: Mainline is linear, but we need to handle variations later.
    // Ideally PGNTree.getGame() exposes a structured way, but for now we iterate the flat list.
    // However, the mainLine array from context is just a linear list of nodes.
    // We assume standard starting position for numbering or just use the node's moveNumber.

    let currentPair: { moveNumber: number; white: MoveNode; black?: MoveNode } | null = null;

    mainLine.forEach((node) => {
        if (node.color === 'w') {
            if (currentPair) {
                movePairs.push(currentPair);
            }
            currentPair = { moveNumber: node.moveNumber, white: node };
        } else {
            if (currentPair && currentPair.moveNumber === node.moveNumber) {
                currentPair.black = node;
                movePairs.push(currentPair);
                currentPair = null;
            } else {
                // Should not happen in standard games starting from white,
                // but possible if starting from black position.
                if (currentPair) movePairs.push(currentPair);
                // Treat as standalone black move or start of new pair if inconsistent
                // For simplified display we just push it as a "black only" row if needed or handle it gracefully
                // But typically black follows white. If we start with black, moveNumber might be X...
                // Let's just push a pair with null white if really needed, but let's stick to standard flow.
                // If we have a lingering pair (white without black), push it.
                if (currentPair) movePairs.push(currentPair);

                // If we are here, it means we have a black move without a preceding white move in this loop logic
                // This happens if the game starts with Black (Setup).
                if (!currentPair && node.color === 'b') {
                    movePairs.push({ moveNumber: node.moveNumber, white: null as any, black: node }); // hacky cast, handle rendering carefully
                }
            }
        }
    });

    // Push last pending pair
    if (currentPair) {
        movePairs.push(currentPair);
    }

    return (
        <div className="flex flex-wrap content-start p-1 gap-x-1 gap-y-0.5 text-xs font-mono select-text bg-[var(--card-bg)] h-full overflow-y-auto">
            {movePairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-1 hover:bg-white/5 rounded px-1">
                    <span className="text-zinc-500 w-6 text-right">{pair.moveNumber}.</span>

                    {/* White Move */}
                    {pair.white ? (
                        <button
                            onClick={() => onGoToNode(pair.white)}
                            className={`px-1 rounded hover:bg-indigo-500/20 transition-colors ${currentNode === pair.white ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-300'}`}
                        >
                            {pair.white.move}
                        </button>
                    ) : (
                        <span className="px-1 w-8 text-center text-zinc-700">...</span>
                    )}

                    {/* Black Move */}
                    {pair.black && (
                        <button
                            onClick={() => onGoToNode(pair.black)}
                            className={`px-1 rounded hover:bg-indigo-500/20 transition-colors ${currentNode === pair.black ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-300'}`}
                        >
                            {pair.black.move}
                        </button>
                    )}
                </div>
            ))}
            <div ref={(el) => { if (el && currentNode === mainLine[mainLine.length - 1]) el.scrollIntoView({ behavior: "smooth" }) }} />
        </div>
    );
}
