'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, useCursor, Text, Instance, Instances } from '@react-three/drei';
import { Chess } from 'chess.js';
import * as THREE from 'three';
import dynamic from 'next/dynamic';

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

interface Square2DProps {
    x: number;
    z: number;
    isBlack: boolean;
    id: string;
    onClick: (id: string) => void;
    highlight?: React.CSSProperties;
    showCoords?: boolean;
    isBottomRank?: boolean;
    isLeftFile?: boolean;
}

interface Piece2DProps {
    type: string;
    color: string;
    position: [number, number, number];
}

interface Board2DProps {
    onSquareClick: (id: string) => void;

    customSquareStyles?: Record<string, React.CSSProperties>;
    orientation: 'white' | 'black';
}

// --- PARTICLES SYSTEM ---
const Particle = ({ position, color }: { position: [number, number, number], color: string }) => {
    const ref = useRef<any>(null);
    const [speed] = useState(() => Math.random() * 0.2 + 0.1);
    const [offset] = useState<[number, number]>(() => [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.position.y += speed * delta * 5;
            ref.current.position.x += offset[0] * delta;
            ref.current.position.z += offset[1] * delta;
            const scale = Math.max(0, ref.current.scale.x - delta);
            ref.current.scale.set(scale, scale, scale);
        }
    });

    return <Instance ref={ref} position={position} color={color} />;
};

const CaptureParticles = ({ triggers }: { triggers: { x: number, z: number, color: string, id: number }[] }) => {
    return (
        <Instances range={1000}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial />
            {triggers.map((t) => (
                <group key={t.id}>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Particle key={i} position={[t.x, 0.5, t.z]} color={t.color} />
                    ))}
                </group>
            ))}
        </Instances>
    );
};

// --- COMPONENTS ---

const Square2D = ({ x, z, isBlack, id, onClick, highlight, showCoords, isBottomRank, isLeftFile }: Square2DProps) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    const position: [number, number, number] = [x, 0, z];

    // Colors - Classic Wood/Green Theme
    const baseColor = isBlack ? '#769656' : '#eeeed2';

    // Highlight handling
    let color = baseColor;

    if (highlight && typeof highlight.background === 'string') {
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
            {highlight?.background && typeof highlight.background === 'string' && highlight.background.includes('radial-gradient') && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <circleGeometry args={[0.15, 32]} />
                    <meshBasicMaterial color="rgba(0,0,0,0.2)" transparent opacity={0.5} />
                </mesh>
            )}

            {/* Capture Hint Ring */}
            {highlight?.background && typeof highlight.background === 'string' && highlight.background.includes('radial-gradient') && highlight.background.includes('255,0,0') && (
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
                    color={isBlack ? '#eeeed2' : '#769656'}
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
                    color={isBlack ? '#eeeed2' : '#769656'}
                    fontWeight="bold"
                >
                    {id.charAt(1)}
                </Text>
            )}
        </group>
    );
};

const Piece2D = ({ type, color, position }: Piece2DProps) => {
    const texture = useLoader(THREE.TextureLoader, getPieceUrl(type, color)) as THREE.Texture;
    // Ensure vibrant colors
    // @ts-ignore
    texture.colorSpace = THREE.SRGBColorSpace;

    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
    );
};

const Board2D = ({ onSquareClick, customSquareStyles, orientation }: Board2DProps) => {
    const squares = useMemo(() => {
        const sq = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isBlack = (row + col) % 2 === 0;
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

const Pieces2D = ({ fen, orientation, onCapture }: { fen: string, orientation: string, onCapture: (x: number, z: number, color: string) => void }) => {
    const pieces = useMemo(() => {
        const p: any[] = [];
        let board: ({ type: string; color: string; square: string } | null)[][] = [];

        try {
            const game = new Chess(fen);
            board = game.board() as any;
        } catch (e) {
            // Manual parsing for invalid FENs (e.g. missing kings)
            // FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
            const fenBoard = fen.split(' ')[0];
            const rows = fenBoard.split('/');

            // Replicate structure: board[row][col] where row 0 is rank 8
            for (let i = 0; i < 8; i++) {
                const row: any[] = [];
                let colIdx = 0;
                const fenRow = rows[i] || '8'; // fallback empty
                for (let char of fenRow) {
                    if (char >= '1' && char <= '8') {
                        const emptyCount = parseInt(char);
                        for (let k = 0; k < emptyCount; k++) {
                            row.push(null);
                            colIdx++;
                        }
                    } else {
                        // Piece
                        const isWhite = char === char.toUpperCase();
                        const type = char.toLowerCase();
                        const color = isWhite ? 'w' : 'b';
                        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                        // Rank = 8 - i
                        // File = colIdx
                        const square = `${files[colIdx]}${8 - i}`;
                        row.push({ type, color, square });
                        colIdx++;
                    }
                }
                while (row.length < 8) row.push(null); // safety fill
                board.push(row);
            }
        }

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

                    p.push({
                        type: square.type,
                        color: square.color,
                        x,
                        z,
                        key: `${rowIndex}-${colIndex}-${square.type}-${square.color}`, // Robust key
                        square: square.square
                    });
                }
            });
        });
        return p;
    }, [fen, orientation]);

    const prevPiecesRef = useRef<any[]>([]);

    // Detect Captures
    useEffect(() => {
        const prevPieces = prevPiecesRef.current;
        if (prevPieces.length > 0) {
            prevPieces.forEach(prevP => {
                const currentP = pieces.find(p => p.x === prevP.x && p.z === prevP.z);
                if (currentP && currentP.color !== prevP.color) {
                    // CAPTURE DETECTED
                    onCapture(prevP.x, prevP.z, prevP.color === 'w' ? '#ffffff' : '#000000');
                }
            });
        }
        prevPiecesRef.current = pieces;
    }, [pieces, onCapture]);

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

const ResponsiveCamera = () => {
    const { size } = useThree();
    // Board is 8x8 units centered at 0,0.
    // We want to fit roughly 9 units (8 + margin) into the smallest dimension of the canvas.
    // Using size (pixels) instead of viewport (units) avoids the feedback loop.
    const zoom = Math.min(size.width, size.height) / 9;

    return (
        <OrthographicCamera
            makeDefault
            position={[0, 10, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            zoom={zoom}
            near={0.1}
            far={1000}
        />
    );
};

// --- ARROWS ---
interface ArrowProps {
    from: string;
    to: string;
    color: string;
}

const Arrow = ({ from, to, color }: ArrowProps) => {
    // Convert square notation to board coordinates
    const getCoords = (square: string) => {
        const col = square.charCodeAt(0) - 97;
        const row = parseInt(square[1]) - 1;
        return { x: col - 3.5, z: 3.5 - row };
    };

    const start = getCoords(from);
    const end = getCoords(to);

    // Calculate vector
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);

    // Angle
    const angle = Math.atan2(dz, dx);

    // Midpoint for position
    const midX = (start.x + end.x) / 2;
    const midZ = (start.z + end.z) / 2;

    return (
        <group position={[midX, 0.15, midZ]} rotation={[0, -angle, 0]}>
            {/* Shaft */}
            <mesh position={[-length / 2 + (length - 0.4) / 2, 0, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[length - 0.5, 0.15, 0.05]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
            {/* Head */}
            <mesh position={[length / 2 - 0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.2, 0.4, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.9} />
            </mesh>
        </group>
    );
};

// WRAPPER FOR DYNAMIC IMPORT
const Chessboard2DContent = ({
    fen,
    orientation = 'white',
    onSquareClick = () => { },
    customSquareStyles,
    arrows = []
}: Chessboard2DProps & { arrows?: ArrowProps[] }) => {
    const [particleTriggers, setParticleTriggers] = useState<{ x: number, z: number, color: string, id: number }[]>([]);

    const handleCapture = (x: number, z: number, color: string) => {
        setParticleTriggers(prev => [...prev, { x, z, color, id: Date.now() }]);
    };

    return (
        <div className="w-full h-full bg-[#303030] relative">
            <Canvas>
                <ResponsiveCamera />
                <color attach="background" args={['#303030']} />
                <group>
                    <Board2D
                        onSquareClick={onSquareClick}
                        customSquareStyles={customSquareStyles}
                        orientation={orientation}
                    />
                    {arrows.map((arrow, i) => (
                        <Arrow key={i} {...arrow} />
                    ))}
                    <React.Suspense fallback={null}>
                        <Pieces2D fen={fen} orientation={orientation} onCapture={handleCapture} />
                    </React.Suspense>
                    <CaptureParticles triggers={particleTriggers} />
                </group>
            </Canvas>
        </div>
    );
};

export default dynamic(() => Promise.resolve(Chessboard2DContent), { ssr: false });
