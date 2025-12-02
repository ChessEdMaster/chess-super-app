'use client';

import React, { useMemo, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrthographicCamera, useCursor, Text } from '@react-three/drei';
import { Chess } from 'chess.js';
import * as THREE from 'three';
import ClientOnly from '@/components/ClientOnly';

// --- ASSETS ---
const PIECE_THEME_URL = "https://images.chesscomfiles.com/chess-themes/pieces/neo/150";

const getPieceUrl = (type: string, color: string) => {
    return `${PIECE_THEME_URL}/${color}${type}.png`;
};

// --- TYPES ---
interface Chessboard2DProps {
    fen: string;
    onSquareClick?: (square: string) => void;
    orientation?: 'white' | 'black';
    customSquareStyles?: Record<string, React.CSSProperties>;
    lastMove?: [string, string];
}

// --- COMPONENTS ---

const Square2D = ({ x, z, isBlack, id, onClick, highlight, showCoords, isBottomRank, isLeftFile }: any) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    const position: [number, number, number] = [x, 0, z];

    // Colors
    const baseColor = isBlack ? '#779954' : '#e9edcc'; // Classic Green/Cream

    // Highlight handling
    let color = baseColor;

    if (highlight) {
        if (highlight.background.includes('rgba(255, 255, 0')) {
            // Selected: Yellowish tint
            color = '#f5f682';
        }
    }

    return (
        <group position={position}>
            {/* Square Mesh */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(id);
                }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Move Hint Dot */}
            {highlight?.background?.includes('radial-gradient') && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <circleGeometry args={[0.15, 32]} />
                    <meshBasicMaterial color="rgba(0,0,0,0.2)" transparent opacity={0.5} />
                </mesh>
            )}

            {/* Capture Hint Ring */}
            {highlight?.background?.includes('radial-gradient') && highlight.background.includes('255,0,0') && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <ringGeometry args={[0.35, 0.45, 32]} />
                    <meshBasicMaterial color="rgba(0,0,0,0.2)" transparent opacity={0.5} />
                </mesh>
            )}

            {/* Coordinates */}
            {showCoords && isBottomRank && (
                <Text
                    position={[0.35, 0.01, 0.35]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.2}
                    color={isBlack ? '#e9edcc' : '#779954'}
                    fontWeight="bold"
                >
                    {id.charAt(0)}
                </Text>
            )}
            {showCoords && isLeftFile && (
                <Text
                    position={[-0.35, 0.01, -0.35]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.2}
                    color={isBlack ? '#e9edcc' : '#779954'}
                    fontWeight="bold"
                >
                    {id.charAt(1)}
                </Text>
            )}
        </group>
    );
};

const Piece2D = ({ type, color, position }: any) => {
    const texture = useLoader(THREE.TextureLoader, getPieceUrl(type, color));

    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial map={texture} transparent />
        </mesh>
    );
};

const Board2D = ({ onSquareClick, customSquareStyles, orientation }: any) => {
    const squares = useMemo(() => {
        const sq = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isBlack = (row + col) % 2 === 1;
                let x = col - 3.5;
                let z = 3.5 - row;

                // Flip for Black orientation
                if (orientation === 'black') {
                    x = -x;
                    z = -z;
                }

                const squareId = `${files[col]}${row + 1}`;

                // Coord logic
                const isBottomRank = orientation === 'black' ? row === 7 : row === 0;
                const isLeftFile = orientation === 'black' ? col === 7 : col === 0;

                sq.push({ x, z, isBlack, id: squareId, isBottomRank, isLeftFile });
            }
        }
        return sq;
    }, [orientation]);

    return (
        <group>
            {squares.map((s) => (
                <Square2D
                    key={s.id}
                    {...s}
                    onClick={onSquareClick}
                    highlight={customSquareStyles?.[s.id]}
                    showCoords={true}
                />
            ))}
        </group>
    );
};

const Pieces2D = ({ fen, orientation }: { fen: string, orientation: string }) => {
    const game = useMemo(() => new Chess(fen), [fen]);
    const board = game.board();

    const pieces: any[] = [];
    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            if (square) {
                let x = colIndex - 3.5;
                let z = rowIndex - 3.5;

                // Flip for Black orientation
                if (orientation === 'black') {
                    x = -x;
                    z = -z;
                }

                pieces.push({
                    type: square.type,
                    color: square.color,
                    x,
                    z,
                    key: `${rowIndex}-${colIndex}`
                });
            }
        });
    });

    return (
        <group>
            {pieces.map((p) => (
                <Piece2D
                    key={p.key}
                    type={p.type}
                    color={p.color}
                    position={[p.x, 0.1, p.z]}
                />
            ))}
        </group>
    );
};

export default function Chessboard2D({
    fen,
    orientation = 'white',
    onSquareClick,
    customSquareStyles
}: Chessboard2DProps) {
    return (
        <ClientOnly>
            <div className="w-full h-full bg-slate-800 rounded-lg overflow-hidden shadow-xl border-4 border-slate-700">
                <Canvas>
                    <OrthographicCamera
                        makeDefault
                        position={[0, 10, 0]}
                        zoom={45}
                        near={0.1}
                        far={100}
                    />

                    <color attach="background" args={['#333']} />

                    <group>
                        <Board2D
                            onSquareClick={onSquareClick}
                            customSquareStyles={customSquareStyles}
                            orientation={orientation}
                        />
                        <Pieces2D fen={fen} orientation={orientation} />
                    </group>
                </Canvas>
            </div>
        </ClientOnly>
    );
}
