'use client';

import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useCursor } from '@react-three/drei';
import { Chess } from 'chess.js';
import * as THREE from 'three';

// --- TYPES ---
interface ChessSceneProps {
    fen: string;
    onSquareClick?: (square: string) => void;
    orientation?: 'white' | 'black';
    customSquareStyles?: Record<string, React.CSSProperties>;
    lastMove?: [string, string]; // [from, to]
}

// --- MATERIALS ---
const whiteMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.2,
    metalness: 0.1,
});

const blackMaterial = new THREE.MeshStandardMaterial({
    color: '#111111',
    roughness: 0.2,
    metalness: 0.8,
});

const highlightMaterial = new THREE.MeshStandardMaterial({
    color: '#fbbf24', // Amber-400
    transparent: true,
    opacity: 0.6,
    roughness: 0.5,
});

const moveHintMaterial = new THREE.MeshStandardMaterial({
    color: '#10b981', // Emerald-500
    transparent: true,
    opacity: 0.5,
    roughness: 0.5,
});

const selectedMaterial = new THREE.MeshStandardMaterial({
    color: '#3b82f6', // Blue-500
    transparent: true,
    opacity: 0.6,
    roughness: 0.5,
});

// --- PIECE COMPONENTS ---

const PieceBase = ({ color, children, position, scale = 1 }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <group position={position} scale={scale}>
            {/* Base */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.35, 0.4, 0.2, 32]} />
            </mesh>
            {children}
        </group>
    );
};

const Pawn = ({ color, position }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <PieceBase color={color} position={position}>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.2, 0.3, 0.4, 16]} />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow material={material}>
                <sphereGeometry args={[0.25, 32, 32]} />
            </mesh>
        </PieceBase>
    );
};

const Rook = ({ color, position }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <PieceBase color={color} position={position}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.3, 0.3, 0.6, 32]} />
            </mesh>
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.35, 0.35, 0.2, 8]} />
            </mesh>
        </PieceBase>
    );
};

const Knight = ({ color, position }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <PieceBase color={color} position={position}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.25, 0.3, 0.6, 16]} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.9, 0.1]} rotation={[-0.2, 0, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.3, 0.4, 0.5]} />
            </mesh>
            {/* Snout */}
            <mesh position={[0, 0.85, 0.35]} rotation={[-0.2, 0, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
            </mesh>
            {/* Ears */}
            <mesh position={[0.1, 1.15, -0.05]} rotation={[0, 0, -0.2]} castShadow receiveShadow material={material}>
                <coneGeometry args={[0.08, 0.2, 4]} />
            </mesh>
            <mesh position={[-0.1, 1.15, -0.05]} rotation={[0, 0, 0.2]} castShadow receiveShadow material={material}>
                <coneGeometry args={[0.08, 0.2, 4]} />
            </mesh>
        </PieceBase>
    );
};

const Bishop = ({ color, position }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <PieceBase color={color} position={position}>
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.2, 0.3, 0.8, 16]} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0, 0.25, 0.4, 16]} />
            </mesh>
            <mesh position={[0, 1.35, 0]} castShadow receiveShadow material={material}>
                <sphereGeometry args={[0.08, 16, 16]} />
            </mesh>
        </PieceBase>
    );
};

const Queen = ({ color, position }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <PieceBase color={color} position={position}>
            <mesh position={[0, 0.7, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.25, 0.35, 1.0, 32]} />
            </mesh>
            <mesh position={[0, 1.3, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.35, 0.1, 0.2, 32]} />
            </mesh>
            <mesh position={[0, 1.45, 0]} castShadow receiveShadow material={material}>
                <sphereGeometry args={[0.15, 32, 32]} />
            </mesh>
        </PieceBase>
    );
};

const King = ({ color, position }: any) => {
    const material = color === 'w' ? whiteMaterial : blackMaterial;
    return (
        <PieceBase color={color} position={position}>
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow material={material}>
                <cylinderGeometry args={[0.3, 0.35, 1.2, 32]} />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
            </mesh>
            {/* Cross */}
            <mesh position={[0, 1.7, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.1, 0.3, 0.1]} />
            </mesh>
            <mesh position={[0, 1.7, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[0.25, 0.1, 0.1]} />
            </mesh>
        </PieceBase>
    );
};

const PieceFactory = ({ type, color, position }: any) => {
    switch (type) {
        case 'p': return <Pawn color={color} position={position} />;
        case 'r': return <Rook color={color} position={position} />;
        case 'n': return <Knight color={color} position={position} />;
        case 'b': return <Bishop color={color} position={position} />;
        case 'q': return <Queen color={color} position={position} />;
        case 'k': return <King color={color} position={position} />;
        default: return null;
    }
};

// --- BOARD COMPONENTS ---

const Square = ({ x, z, isBlack, id, onClick, highlight }: any) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    const position: [number, number, number] = [x, 0, z];
    const color = isBlack ? '#779954' : '#e9edcc'; // Classic Green/Cream

    // Determine material based on highlight
    let material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.1,
    });

    if (highlight) {
        if (highlight.background.includes('rgba(255, 255, 0')) {
            // Selected piece
            material = selectedMaterial;
        } else if (highlight.background.includes('radial-gradient')) {
            // Valid move
            material = moveHintMaterial;
        }
    }

    return (
        <mesh
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => {
                e.stopPropagation();
                onClick(id);
            }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            receiveShadow
        >
            {/* Use BoxGeometry for thickness to avoid Z-fighting */}
            <boxGeometry args={[1, 1, 0.1]} />
            <primitive object={material} attach="material" />

            {/* Hover effect overlay - Raised higher */}
            {hovered && (
                <mesh position={[0, 0, 0.06]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial color="white" transparent opacity={0.2} />
                </mesh>
            )}
        </mesh>
    );
};

const Board = ({ onSquareClick, customSquareStyles }: any) => {
    const squares = useMemo(() => {
        const sq = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isBlack = (row + col) % 2 === 0;
                const x = col - 3.5;
                const z = 3.5 - row;
                const squareId = `${files[col]}${row + 1}`;
                sq.push({ x, z, isBlack, id: squareId });
            }
        }
        return sq;
    }, []);

    return (
        <group>
            {/* Board Border */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
                <boxGeometry args={[9, 0.2, 9]} />
                <meshStandardMaterial color="#3d2b1f" roughness={0.6} />
            </mesh>

            {/* Squares */}
            {squares.map((s) => (
                <Square
                    key={s.id}
                    x={s.x}
                    z={s.z}
                    isBlack={s.isBlack}
                    id={s.id}
                    onClick={onSquareClick}
                    highlight={customSquareStyles?.[s.id]}
                />
            ))}
        </group>
    );
};

const Pieces = ({ fen }: { fen: string }) => {
    const pieces = useMemo(() => {
        let board: ({ type: string; color: string; square: string } | null)[][] = [];
        try {
            const game = new Chess(fen);
            board = game.board() as any;
        } catch (e) {
            // Manual parsing backing (same logic as 2D)
            const fenBoard = fen.split(' ')[0];
            const rows = fenBoard.split('/');

            for (let i = 0; i < 8; i++) {
                const row: any[] = [];
                let colIdx = 0;
                const fenRow = rows[i] || '8';
                for (let char of fenRow) {
                    if (char >= '1' && char <= '8') {
                        const emptyCount = parseInt(char);
                        for (let k = 0; k < emptyCount; k++) {
                            row.push(null);
                            colIdx++;
                        }
                    } else {
                        const isWhite = char === char.toUpperCase();
                        const type = char.toLowerCase();
                        const color = isWhite ? 'w' : 'b';
                        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                        const square = `${files[colIdx]}${8 - i}`;
                        row.push({ type, color, square });
                        colIdx++;
                    }
                }
                while (row.length < 8) row.push(null);
                board.push(row);
            }
        }

        const p: any[] = [];
        board.forEach((row, rowIndex) => {
            row.forEach((square, colIndex) => {
                if (square) {
                    const x = colIndex - 3.5;
                    const z = rowIndex - 3.5;
                    p.push({
                        type: square.type,
                        color: square.color,
                        x,
                        z,
                        key: `${rowIndex}-${colIndex}`
                    });
                }
            });
        });
        return p;
    }, [fen]);

    return (
        <group>
            {pieces.map((p) => (
                <PieceFactory
                    key={p.key}
                    type={p.type}
                    color={p.color}
                    position={[p.x, 0, p.z]}
                />
            ))}
        </group>
    );
};

import ClientOnly from '@/components/ClientOnly';

// ...

// --- ARROWS ---
interface ArrowProps {
    from: string;
    to: string;
    color: string;
}

const Arrow = ({ from, to, color }: ArrowProps) => {
    // Convert square notation to board coordinates
    // Same coordinate system as Board: files 'a' -> 'h' map to x (-3.5 -> 3.5)
    // ranks 1 -> 8 map to z (3.5 -> -3.5)

    const getCoords = (square: string) => {
        const col = square.charCodeAt(0) - 97;
        const row = parseInt(square[1]) - 1;

        // Match Board logic: 
        // x = col - 3.5
        // z = 3.5 - row (reversed because row 0 is rank 1 which is at z=3.5)

        return { x: col - 3.5, z: 3.5 - row };
    };

    const start = getCoords(from);
    const end = getCoords(to);

    // Calculate vector properties
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);

    // Angle in XZ plane
    // atan2(z, x) gives angle from X axis.
    // Three.js rotation "y" is around Y axis.
    // We want to rotate a box that starts pointing along X axis? 
    // Usually easier to compute rotation.
    // Let's assume default box aligns with X.
    const angle = Math.atan2(dz, dx);

    // Midpoint
    const midX = (start.x + end.x) / 2;
    const midZ = (start.z + end.z) / 2;

    // Lift arrow slightly above board/pieces if possible, or just above board
    // Pieces are roughly 1 unit high. Let's put arrow at 0.1 for ground level or higher for "over pieces"
    // Ground level is better for clarity usually, but might clip.
    const yHeight = 0.05;

    return (
        <group position={[midX, yHeight, midZ]} rotation={[0, -angle, 0]}>
            {/* Shaft */}
            {/* Length adjusted so head doesn't overlap excessively or fall short */}
            <mesh position={[-length / 2 + (length - 0.5) / 2, 0, 0]} receiveShadow castShadow>
                <boxGeometry args={[length - 0.5, 0.15, 0.05]} />
                <meshStandardMaterial color={color} transparent opacity={0.8} />
            </mesh>
            {/* Head */}
            <mesh position={[length / 2 - 0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]} receiveShadow castShadow>
                <coneGeometry args={[0.25, 0.5, 32]} />
                <meshStandardMaterial color={color} transparent opacity={0.9} />
            </mesh>
        </group>
    );
};

export default function ChessScene({
    fen,
    orientation = 'white',
    onSquareClick,
    customSquareStyles,
    arrows = []
}: ChessSceneProps & { arrows?: ArrowProps[] }) {
    return (
        <ClientOnly>
            <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
                <Canvas shadows camera={{ position: [0, 8, 6], fov: 45 }}>
                    <color attach="background" args={['#1a1a1a']} />

                    {/* Lighting */}
                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                    <pointLight position={[-10, 10, -10]} intensity={0.5} />
                    <spotLight position={[0, 15, 0]} angle={0.5} penumbra={1} intensity={1} castShadow shadow-bias={-0.0001} />

                    <Stage environment="city" intensity={0.5} adjustCamera={false} shadows={false}>
                        <group rotation={[0, orientation === 'black' ? Math.PI : 0, 0]}>
                            <Board onSquareClick={onSquareClick} customSquareStyles={customSquareStyles} />

                            {/* Render Arrows */}
                            {arrows.map((arrow, i) => (
                                <Arrow key={i} {...arrow} />
                            ))}

                            <Pieces fen={fen} />
                        </group>
                    </Stage>

                    <OrbitControls
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2.2}
                        maxDistance={15}
                        minDistance={5}
                    />
                </Canvas>
            </div>
        </ClientOnly>
    );
}
