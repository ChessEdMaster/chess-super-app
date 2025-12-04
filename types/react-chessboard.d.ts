declare module 'react-chessboard' {
    import * as React from 'react';

    export interface ChessboardProps {
        /** FEN string representing board position */
        position?: string;
        /** Callback when a piece is dropped */
        onPieceDrop?: (args: { sourceSquare: string; targetSquare: string | null }) => boolean;
        /** Board orientation, "white" or "black" */
        boardOrientation?: 'white' | 'black';
        /** Animation duration in milliseconds */
        animationDurationInMs?: number;
        /** Custom dark square style */
        customDarkSquareStyle?: React.CSSProperties;
        /** Custom light square style */
        customLightSquareStyle?: React.CSSProperties;
        /** Array of custom arrows: [from, to, color] */
        customArrows?: [string, string, string][];
        /** Custom square styles */
        customSquareStyles?: Record<string, React.CSSProperties>;
        /** Square click handler */
        onSquareClick?: (square: string) => void;
        /** Square right click handler */
        onSquareRightClick?: (square: string) => void;
        /** Whether pieces can be dragged */
        arePiecesDraggable?: boolean;
        /** Component ID */
        id?: string;
    }

    export const Chessboard: React.FC<ChessboardProps>;
}
