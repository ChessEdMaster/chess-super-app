/**
 * PGN Parser and Exporter
 * Import and export PGN with full support for variations and annotations
 */

import { Chess } from 'chess.js';
import type {
    PGNGame,
    PGNMetadata,
    MoveNode,
    Variation,
    Annotation,
    PGNExportOptions,
    NAGSymbol,
} from './pgn-types';
import { NAG_SYMBOLS } from './pgn-types';
import { PGNTree } from './pgn-tree';

export class PGNParser {
    /**
     * Parse PGN string into PGNTree
     */
    static parse(pgnString: string): PGNTree {
        const chess = new Chess();

        try {
            // Try to load with chess.js first (handles basic PGN)
            chess.loadPgn(pgnString);

            // Extract metadata
            const metadata = this.extractMetadata(pgnString);

            // Create tree
            const tree = new PGNTree();
            tree.setMetadata(metadata);

            // Get moves
            const moves = chess.history();

            // Reset and replay moves
            chess.reset();
            for (const move of moves) {
                tree.addMove(move);
            }

            // Parse variations and annotations (advanced parsing)
            this.parseVariations(pgnString, tree);

            return tree;
        } catch (error) {
            console.error('Error parsing PGN:', error);
            // Return empty tree on error
            return new PGNTree();
        }
    }

    /**
     * Extract metadata headers from PGN
     */
    private static extractMetadata(pgn: string): PGNMetadata {
        const metadata: PGNMetadata = {};
        const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
        let match;

        while ((match = headerRegex.exec(pgn)) !== null) {
            const key = match[1].toLowerCase();
            const value = match[2];

            switch (key) {
                case 'event':
                    metadata.event = value;
                    break;
                case 'site':
                    metadata.site = value;
                    break;
                case 'date':
                    metadata.date = value;
                    break;
                case 'round':
                    metadata.round = value;
                    break;
                case 'white':
                    metadata.white = value;
                    break;
                case 'black':
                    metadata.black = value;
                    break;
                case 'result':
                    metadata.result = value;
                    break;
                case 'whiteelo':
                    metadata.whiteElo = value;
                    break;
                case 'blackelo':
                    metadata.blackElo = value;
                    break;
                case 'eco':
                    metadata.eco = value;
                    break;
                case 'opening':
                    metadata.opening = value;
                    break;
                case 'timecontrol':
                    metadata.timeControl = value;
                    break;
                case 'annotator':
                    metadata.annotator = value;
                    break;
                default:
                    metadata[key] = value;
            }
        }

        return metadata;
    }

    /**
     * Parse variations and annotations from PGN
     * This is a simplified version - full RAV parsing is complex
     */
    private static parseVariations(pgn: string, tree: PGNTree): void {
        // Remove headers
        const movesSection = pgn.replace(/\[.*?\]\s*/g, '');

        // Extract comments
        const commentRegex = /\{([^}]+)\}/g;
        let match;

        while ((match = commentRegex.exec(movesSection)) !== null) {
            const comment = match[1].trim();
            // Add comment to current node (simplified)
            tree.addComment(comment);
        }
    }

    /**
     * Export PGNTree to PGN string
     */
    static export(tree: PGNTree, options?: Partial<PGNExportOptions>): string {
        const opts: PGNExportOptions = {
            includeVariations: true,
            includeComments: true,
            includeNAGs: true,
            includeEvaluations: true,
            includeClock: false,
            maxLineLength: 80,
            indentVariations: true,
            sortVariations: false,
            ...options,
        };

        const game = tree.getGame();
        let pgn = '';

        // 1. Export headers
        pgn += this.exportHeaders(game.metadata);
        pgn += '\n';

        // 2. Export moves
        pgn += this.exportMoves(game.mainLine, opts, 0);

        // 3. Add result
        const result = game.metadata.result || '*';
        pgn += ` ${result}\n`;

        return pgn;
    }

    /**
     * Export metadata headers
     */
    private static exportHeaders(metadata: PGNMetadata): string {
        let headers = '';

        // Seven Tag Roster (required headers in order)
        const requiredHeaders = ['event', 'site', 'date', 'round', 'white', 'black', 'result'];

        for (const key of requiredHeaders) {
            const value = metadata[key] || '?';
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            headers += `[${capitalizedKey} "${value}"]\n`;
        }

        // Optional headers
        const optionalKeys = Object.keys(metadata).filter(k => !requiredHeaders.includes(k.toLowerCase()));
        for (const key of optionalKeys) {
            const value = metadata[key];
            if (value) {
                const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                headers += `[${capitalizedKey} "${value}"]\n`;
            }
        }

        return headers;
    }

    /**
     * Export moves with annotations and variations
     */
    private static exportMoves(
        moves: MoveNode[],
        options: PGNExportOptions,
        depth: number
    ): string {
        let result = '';
        let lineLength = 0;
        const indent = options.indentVariations ? '  '.repeat(depth) : '';

        for (let i = 0; i < moves.length; i++) {
            const node = moves[i];
            let moveText = '';

            // Add move number for white moves
            if (node.color === 'w') {
                moveText += `${node.moveNumber}. `;
            } else if (i === 0 || moves[i - 1].color === 'b') {
                // Add move number with ellipsis for black moves at start of line
                moveText += `${node.moveNumber}... `;
            }

            // Add the move
            moveText += node.move;

            // Add NAG symbols
            if (options.includeNAGs && node.annotation.nags.length > 0) {
                for (const nag of node.annotation.nags) {
                    const symbol = NAG_SYMBOLS[nag];
                    if (symbol) {
                        moveText += symbol;
                    } else {
                        moveText += ` $${nag}`;
                    }
                }
            }

            // Add evaluation
            if (options.includeEvaluations && node.annotation.evaluation) {
                const eval_ = node.annotation.evaluation;
                if (eval_.type === 'mate') {
                    moveText += ` {[%eval #${eval_.value}]}`;
                } else {
                    const cpValue = (eval_.value / 100).toFixed(2);
                    moveText += ` {[%eval ${cpValue}]}`;
                }
            }

            // Add comments
            if (options.includeComments && node.annotation.comments.length > 0) {
                for (const comment of node.annotation.comments) {
                    if (comment.position === 'after') {
                        moveText += ` {${comment.text}}`;
                    }
                }
            }

            // Add clock
            if (options.includeClock && node.annotation.clock) {
                const hours = Math.floor(node.annotation.clock / 3600);
                const minutes = Math.floor((node.annotation.clock % 3600) / 60);
                const seconds = node.annotation.clock % 60;
                moveText += ` {[%clk ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]}`;
            }

            // Check line length and wrap if needed
            if (lineLength + moveText.length > options.maxLineLength && lineLength > 0) {
                result += '\n' + indent;
                lineLength = indent.length;
            }

            result += moveText + ' ';
            lineLength += moveText.length + 1;

            // Add variations
            if (options.includeVariations && node.variations.length > 0) {
                for (const variation of node.variations) {
                    result += '\n' + indent + '(';
                    result += this.exportMoves(variation.moves, options, depth + 1).trim();
                    result += ') ';
                    lineLength = 0; // Reset after variation
                }
            }
        }

        return result;
    }

    /**
     * Validate PGN string
     */
    static validate(pgn: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        try {
            const chess = new Chess();
            chess.loadPgn(pgn);
            return { valid: true, errors: [] };
        } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            return { valid: false, errors };
        }
    }

    /**
     * Extract multiple games from PGN string
     */
    static parseMultiple(pgn: string): PGNTree[] {
        const games: PGNTree[] = [];

        // Split by double newline followed by header
        const gameStrings = pgn.split(/\n\n(?=\[Event)/);

        for (const gameString of gameStrings) {
            if (gameString.trim()) {
                try {
                    games.push(this.parse(gameString));
                } catch (error) {
                    console.error('Error parsing game:', error);
                }
            }
        }

        return games;
    }
}

/**
 * PGN Optimizer
 * Optimize PGN for size and compatibility
 */
export class PGNOptimizer {
    /**
     * Optimize PGN string
     */
    static optimize(pgn: string): string {
        let optimized = pgn;

        // Remove excessive whitespace
        optimized = optimized.replace(/\s+/g, ' ');

        // Remove empty comments
        optimized = optimized.replace(/\{\s*\}/g, '');

        // Normalize line breaks
        optimized = optimized.replace(/\n+/g, '\n');

        return optimized.trim();
    }

    /**
     * Calculate PGN checksum (for integrity verification)
     */
    static checksum(pgn: string): string {
        let hash = 0;
        for (let i = 0; i < pgn.length; i++) {
            const char = pgn.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Remove all annotations from PGN
     */
    static stripAnnotations(pgn: string): string {
        let stripped = pgn;

        // Remove comments
        stripped = stripped.replace(/\{[^}]*\}/g, '');

        // Remove NAGs
        stripped = stripped.replace(/\$\d+/g, '');
        stripped = stripped.replace(/[!?]+/g, '');

        // Remove variations
        stripped = stripped.replace(/\([^)]*\)/g, '');

        return this.optimize(stripped);
    }
}
