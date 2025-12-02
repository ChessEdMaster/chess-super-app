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

const Pieces2D = ({ fen, orientation, onCapture }: { fen: string, orientation: string, onCapture: (x: number, z: number, color: string) => void }) => {
    const game = useMemo(() => new Chess(fen), [fen]);
    const board = game.board();
    const prevPiecesRef = useRef<any[]>([]);

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
                    key: `${rowIndex}-${colIndex}`,
                    square: square.square
                });
            }
        });
    });

    // Detect Captures
    useEffect(() => {
        const prevPieces = prevPiecesRef.current;
        if (prevPieces.length > 0) {
            // Find pieces that were present but are now gone (captured)
            // Note: This is a simple heuristic. In a real move, a piece moves to a square occupied by another.
            // So we look for a square that had a piece, and now has a DIFFERENT piece (capture) or NO piece (en passant/movement).
            // Actually, simpler: if a piece of color X was at square S, and now piece of color Y is at square S, it's a capture.

            prevPieces.forEach(prevP => {
                const currentP = pieces.find(p => p.x === prevP.x && p.z === prevP.z);
                if (currentP && currentP.color !== prevP.color) {
                    // CAPTURE DETECTED at (x, z)
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
    const { viewport } = useThree();
    // Board is 8x8. We want to fit 8 units in the smallest dimension.
    // Orthographic camera zoom is "pixels per unit" usually, but in R3F default Orthographic camera:
    // The view size is controlled by the camera's left/right/top/bottom.
    // If we use makeDefault, R3F handles aspect ratio.
    // We want to ensure the board (width 8, height 8) is visible.

    // Actually, simpler approach:
    // Use a fixed zoom but scale the group? No.
    // Use Drei's Bounds?
    // Let's just use a manual calculation.

    // If we use standard OrthographicCamera from THREE:
    // zoom = canvas_height / ortho_height
    // We want ortho_height to be at least 9 (8 + margin).

    return (
        <OrthographicCamera
            makeDefault
            position={[0, 10, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            zoom={Math.min(viewport.width, viewport.height) * 45} // Approximate heuristic
            near={0.1}
            far={1000}
        />
    );
};

// ... (rest of imports)

// WRAPPER FOR DYNAMIC IMPORT
const Chessboard2DContent = ({
    fen,
    orientation = 'white',
    onSquareClick = () => { },
    customSquareStyles
}: Chessboard2DProps) => {
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

