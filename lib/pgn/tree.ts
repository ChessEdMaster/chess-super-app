/**
 * PGN Tree Manager
 * Core engine for managing game tree with variations and annotations
 */

import { Chess } from 'chess.js';
import type {
    MoveNode,
    Variation,
    Annotation,
    PGNGame,
    PGNMetadata,
    Comment,
    NAGSymbol,
    Evaluation,
    VisualAnnotation,
    WorkPGNData,
} from '@/types/pgn';

export class PGNTree {
    private game: PGNGame;
    private chess: Chess;

    constructor(startingFen?: string) {
        const initialFen = startingFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        this.game = {
            metadata: {},
            rootPosition: initialFen,
            mainLine: [],
            currentNode: null,
        };

        this.chess = new Chess(initialFen);
    }

    // Generate unique ID for nodes
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create a deep clone of the tree
     */
    clone(): PGNTree {
        const newTree = new PGNTree(this.game.rootPosition);

        // Use JSON for deep clone of the game structure (careful with parent refs)
        // We'll use the serialization/deserialization logic we already have or a custom one
        const data = this.toJSON();
        const cloned = PGNTree.fromJSON(data);

        // Ensure current node is correctly set in the clone
        if (this.game.currentNode) {
            // Re-find the current node in the new tree by ID
            const findNodeById = (nodeId: string, nodes: MoveNode[]): MoveNode | null => {
                for (const node of nodes) {
                    if (node.id === nodeId) return node;
                    for (const v of node.variations) {
                        const found = findNodeById(nodeId, v.moves);
                        if (found) return found;
                    }
                }
                return null;
            };

            cloned.game.currentNode = findNodeById(this.game.currentNode.id, cloned.game.mainLine);
            if (cloned.game.currentNode) {
                cloned.goToNode(cloned.game.currentNode);
            }
        }

        return cloned;
    }

    // Create empty annotation
    private createEmptyAnnotation(): Annotation {
        return {
            comments: [],
            nags: [],
            visualAnnotations: [],
        };
    }

    // Add a move to the current position
    addMove(san: string, createVariation = false): MoveNode | null {
        try {
            const currentFen = this.chess.fen();
            const move = this.chess.move(san);

            if (!move) return null;

            const newNode: MoveNode = {
                id: this.generateId(),
                move: move.san,
                fen: this.chess.fen(),
                uci: move.from + move.to + (move.promotion || ''),
                annotation: this.createEmptyAnnotation(),
                variations: [],
                parent: this.game.currentNode,
                mainLine: !createVariation && (this.game.currentNode?.mainLine ?? true),
                moveNumber: Math.floor(this.chess.moveNumber()),
                color: move.color,
            };

            if (!this.game.currentNode) {
                // First move of the game
                this.game.mainLine.push(newNode);
                this.game.currentNode = newNode;
            } else if (createVariation) {
                // Add as variation
                const variation: Variation = {
                    id: this.generateId(),
                    moves: [newNode],
                    startingFen: currentFen,
                    isMainLine: false,
                };
                this.game.currentNode.variations.push(variation);
                this.game.currentNode = newNode;
            } else {
                // Continue main line or current variation
                if (this.game.currentNode.mainLine) {
                    this.game.mainLine.push(newNode);
                }
                this.game.currentNode = newNode;
            }

            return newNode;
        } catch (error) {
            console.error('Error adding move:', error);
            return null;
        }
    }

    // Navigate to a specific node
    goToNode(node: MoveNode | null): void {
        if (!node) {
            // Go to starting position
            this.chess.load(this.game.rootPosition);
            this.game.currentNode = null;
            return;
        }

        // Rebuild position by replaying moves from root
        const path = this.getPathToNode(node);
        this.chess.load(this.game.rootPosition);

        for (const pathNode of path) {
            this.chess.move(pathNode.move);
        }

        this.game.currentNode = node;
    }

    // Get path from root to a specific node
    private getPathToNode(node: MoveNode): MoveNode[] {
        const path: MoveNode[] = [];
        let current: MoveNode | null = node;

        while (current) {
            path.unshift(current);
            current = current.parent;
        }

        return path;
    }

    // Navigate forward (next move in current line)
    goForward(): MoveNode | null {
        if (!this.game.currentNode) {
            // At start, go to first move
            if (this.game.mainLine.length > 0) {
                this.goToNode(this.game.mainLine[0]);
                return this.game.currentNode;
            }
            return null;
        }

        // Find next move in current variation
        const nextNode = this.findNextMove(this.game.currentNode);
        if (nextNode) {
            this.goToNode(nextNode);
        }

        return nextNode;
    }

    // Navigate backward (previous move)
    goBack(): MoveNode | null {
        if (!this.game.currentNode) return null;

        const parent = this.game.currentNode.parent;
        this.goToNode(parent);
        return parent;
    }

    // Find next move in the current line
    private findNextMove(node: MoveNode): MoveNode | null {
        // Check if this node has a continuation in main line
        const nodeIndex = this.game.mainLine.indexOf(node);
        if (nodeIndex !== -1 && nodeIndex < this.game.mainLine.length - 1) {
            return this.game.mainLine[nodeIndex + 1];
        }

        // Check variations
        if (node.variations.length > 0 && node.variations[0].moves.length > 0) {
            return node.variations[0].moves[0];
        }

        return null;
    }

    // Add comment to current move
    addComment(text: string, position: 'before' | 'after' = 'after'): void {
        if (!this.game.currentNode) return;

        const comment: Comment = { text, position };
        this.game.currentNode.annotation.comments.push(comment);
    }

    // Remove comment
    removeComment(index: number): void {
        if (!this.game.currentNode) return;
        this.game.currentNode.annotation.comments.splice(index, 1);
    }

    // Update comment
    updateComment(index: number, text: string): void {
        if (!this.game.currentNode && index < this.game.currentNode!.annotation.comments.length) return;
        this.game.currentNode!.annotation.comments[index].text = text;
    }

    // Add NAG symbol
    addNAG(nag: NAGSymbol): void {
        if (!this.game.currentNode) return;

        // Remove conflicting NAGs (e.g., can't have both ! and ?)
        const conflictGroups = [
            [1, 2, 3, 4, 5, 6], // Move quality
            [10, 13, 14, 15, 16, 17, 18, 19], // Position evaluation
        ];

        for (const group of conflictGroups) {
            if (group.includes(nag)) {
                this.game.currentNode.annotation.nags = this.game.currentNode.annotation.nags.filter(
                    n => !group.includes(n)
                );
            }
        }

        if (!this.game.currentNode.annotation.nags.includes(nag)) {
            this.game.currentNode.annotation.nags.push(nag);
        }
    }

    // Remove NAG symbol
    removeNAG(nag: NAGSymbol): void {
        if (!this.game.currentNode) return;
        this.game.currentNode.annotation.nags = this.game.currentNode.annotation.nags.filter(n => n !== nag);
    }

    // Set evaluation
    setEvaluation(evaluation: Evaluation): void {
        if (!this.game.currentNode) return;
        this.game.currentNode.annotation.evaluation = evaluation;
    }

    // Add visual annotation (arrow or highlight)
    addVisualAnnotation(annotation: VisualAnnotation): void {
        if (!this.game.currentNode) return;
        this.game.currentNode.annotation.visualAnnotations.push(annotation);
    }

    // Remove visual annotation
    removeVisualAnnotation(index: number): void {
        if (!this.game.currentNode) return;
        this.game.currentNode.annotation.visualAnnotations.splice(index, 1);
    }

    // Add image URL
    addImage(url: string): void {
        if (!this.game.currentNode) return;
        if (!this.game.currentNode.annotation.images) {
            this.game.currentNode.annotation.images = [];
        }
        this.game.currentNode.annotation.images.push(url);
    }

    // Remove image URL
    removeImage(index: number): void {
        if (!this.game.currentNode || !this.game.currentNode.annotation.images) return;
        this.game.currentNode.annotation.images.splice(index, 1);
    }

    // Delete a variation
    deleteVariation(variationId: string): void {
        if (!this.game.currentNode) return;

        this.game.currentNode.variations = this.game.currentNode.variations.filter(
            v => v.id !== variationId
        );
    }

    // Promote variation to main line
    promoteVariation(variationId: string): void {
        if (!this.game.currentNode) return;

        const varIndex = this.game.currentNode.variations.findIndex(v => v.id === variationId);
        if (varIndex === -1) return;

        // Swap with first variation (or main line)
        if (varIndex > 0) {
            const temp = this.game.currentNode.variations[0];
            this.game.currentNode.variations[0] = this.game.currentNode.variations[varIndex];
            this.game.currentNode.variations[varIndex] = temp;
        }
    }

    // Get all variations at current position
    getVariations(): Variation[] {
        if (!this.game.currentNode) return [];
        return this.game.currentNode.variations;
    }

    // Set metadata
    setMetadata(metadata: Partial<PGNMetadata>): void {
        this.game.metadata = { ...this.game.metadata, ...metadata };
    }

    // Get current game state
    getGame(): PGNGame {
        return this.game;
    }

    // Get current position FEN
    getCurrentFen(): string {
        return this.chess.fen();
    }

    // Get current node
    getCurrentNode(): MoveNode | null {
        return this.game.currentNode;
    }

    // Get main line moves
    getMainLine(): MoveNode[] {
        return this.game.mainLine;
    }

    // Reset to starting position
    reset(): void {
        this.chess.load(this.game.rootPosition);
        this.game.currentNode = null;
    }

    // Clear all moves and variations
    clear(): void {
        this.game.mainLine = [];
        this.game.currentNode = null;
        this.chess.load(this.game.rootPosition);
    }

    // Get move count
    getMoveCount(): number {
        return this.game.mainLine.length;
    }

    // Check if at starting position
    isAtStart(): boolean {
        return this.game.currentNode === null;
    }

    // Check if at end of current line
    isAtEnd(): boolean {
        if (!this.game.currentNode) return this.game.mainLine.length === 0;
        return this.findNextMove(this.game.currentNode) === null;
    }
    // Get header value
    getHeader(key: string): string | undefined {
        // Standardize key case if needed, or just access directly
        // Usually PGN headers are Case Sensitive but commonly Title Case
        return this.game.metadata[key];
    }

    // Convert tree to PGN string
    toString(): string {
        let pgn = '';

        // 1. Headers
        const headers: Record<string, string> = {
            'Event': '?',
            'Site': '?',
            'Date': '????.??.??',
            'Round': '?',
            'White': '?',
            'Black': '?',
            'Result': '*',
            ...this.game.metadata
        };

        for (const [key, value] of Object.entries(headers)) {
            pgn += `[${key} "${value}"]\n`;
        }
        pgn += '\n';

        // 2. Moves
        pgn += this.renderVariations(this.game.mainLine);

        // 3. Result
        pgn += ` ${headers['Result'] || '*'}`;

        return pgn;
    }

    private renderVariations(moves: MoveNode[]): string {
        let result = '';
        let moveNumber = 1; // Track locally, though nodes have it

        for (let i = 0; i < moves.length; i++) {
            const node = moves[i];

            // Move Number (if white or first move in sequence)
            if (node.color === 'w') {
                result += `${node.moveNumber}. `;
            } else if (i === 0) {
                result += `${node.moveNumber}... `;
            }

            // Move SAN
            result += node.move;

            // NAGs
            if (node.annotation.nags.length > 0) {
                result += node.annotation.nags.map(n => ` $${n}`).join('');
            }

            // Comments
            if (node.annotation.comments.length > 0) {
                const text = node.annotation.comments.map(c => c.text).join(' ');
                result += ` {${text}}`;
            }

            result += ' ';

            // Variations
            if (node.variations.length > 0) {
                for (const variation of node.variations) {
                    result += `( ${this.renderVariations(variation.moves)} ) `;
                }
            }
        }
        return result.trim();
    }

    // --- JSON Serialization for WorkPGN ---

    toJSON(): WorkPGNData {
        // Deep clone to strip internal state but we need to handle circular 'parent' refs
        // We can just serialize the mainLine and variations, but JSON.stringify will choke on parent refs.
        // We'll use a replacer or manual traversal if needed, but actually we can just
        // rely on the structure modification helper.

        const serializeNode = (node: MoveNode): any => {
            const { parent, ...rest } = node;
            return {
                ...rest,
                variations: node.variations.map(v => ({
                    ...v,
                    moves: v.moves.map(m => serializeNode(m))
                }))
            };
        };

        const serializedMoves = this.game.mainLine.map(node => serializeNode(node));

        return {
            metadata: this.game.metadata,
            rootPosition: this.game.rootPosition,
            moves: serializedMoves,
            version: 1
        };
    }

    static fromJSON(data: WorkPGNData): PGNTree {
        const tree = new PGNTree(data.rootPosition);
        tree.game.metadata = data.metadata;

        // Reconstruct nodes
        // We need to recursively rebuild the tree and link parents

        const restoreNodes = (nodes: any[], parent: MoveNode | null): MoveNode[] => {
            return nodes.map(raw => {
                const node: MoveNode = {
                    ...raw,
                    parent: parent,
                    variations: [] // placeholder
                };

                // Restore variations
                if (raw.variations) {
                    node.variations = raw.variations.map((v: any) => ({
                        ...v,
                        moves: restoreNodes(v.moves, node)
                    }));
                }
                return node;
            });
        };

        tree.game.mainLine = restoreNodes(data.moves as any[], null);

        // Set current node to end of main line
        if (tree.game.mainLine.length > 0) {
            let current = tree.game.mainLine[tree.game.mainLine.length - 1];
            // Optional: Go deeper if standard behavior
            tree.game.currentNode = current;
            // Update internal chess instance to match
            tree.goToNode(current);
        } else {
            tree.game.currentNode = null;
        }

        return tree;
    }
}
