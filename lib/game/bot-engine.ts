import { Chess, Move } from 'chess.js';

export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'GATEKEEPER';

export class BotEngine {
    private game: Chess;
    private difficulty: BotDifficulty;

    constructor(fen: string, difficulty: BotDifficulty = 'MEDIUM') {
        this.game = new Chess(fen);
        this.difficulty = difficulty;
    }

    public makeMove(): Move | null {
        const moves = this.game.moves({ verbose: true });
        if (moves.length === 0) return null;

        let selectedMove: Move;

        switch (this.difficulty) {
            case 'EASY':
                // 100% Random
                selectedMove = moves[Math.floor(Math.random() * moves.length)];
                break;
            
            case 'MEDIUM':
                // 80% Random, 20% Capture/Check priority
                if (Math.random() > 0.8) {
                    selectedMove = this.getBestMove(moves);
                } else {
                    selectedMove = moves[Math.floor(Math.random() * moves.length)];
                }
                break;

            case 'HARD':
            case 'GATEKEEPER':
                // 50% Best move (Capture/Check), 50% Randomish
                // (Real implementation would use Stockfish WebWorker)
                selectedMove = this.getBestMove(moves);
                break;

            default:
                selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }

        this.game.move(selectedMove);
        return selectedMove;
    }

    private getBestMove(moves: Move[]): Move {
        // Simple heuristic: Captures > Checks > Random
        const captures = moves.filter(m => m.captured);
        if (captures.length > 0) return captures[Math.floor(Math.random() * captures.length)];

        const checks = moves.filter(m => this.isCheck(m));
        if (checks.length > 0) return checks[Math.floor(Math.random() * checks.length)];

        return moves[Math.floor(Math.random() * moves.length)];
    }

    private isCheck(move: Move): boolean {
        const tempGame = new Chess(this.game.fen());
        tempGame.move(move);
        return tempGame.isCheck();
    }
}
