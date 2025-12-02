'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stage } from '@react-three/drei';
import { Chess } from 'chess.js';

interface ChessSceneProps {
    fen: string;
    onMove?: (from: string, to: string) => void;
    orientation?: 'white' | 'black';
}

function Board() {
    const squares = useMemo(() => {
        const sq = [];
        for (let i = 0; i < 64; i++) {
            const x = (i % 8) - 3.5;
            const z = Math.floor(i / 8) - 3.5;
            const isBlack = (Math.floor(i / 8) + (i % 8)) % 2 === 1;
            sq.push({ x, z, isBlack, id: i });
        }
        return sq;
    }, []);

    return (
        <group>
            {squares.map((s) => (
                <mesh key={s.id} position={[s.x, -0.1, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <meshStandardMaterial color={s.isBlack ? '#769656' : '#eeeed2'} />
                </mesh>
            ))}
            <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[8.2, 0.2, 8.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    );
}

function Pieces({ fen }: { fen: string }) {
    const game = useMemo(() => new Chess(fen), [fen]);
    const board = game.board();

    const pieces: { type: string; color: string; x: number; z: number; key: string }[] = [];
    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            if (square) {
                pieces.push({
                    type: square.type,
                    color: square.color,
                    x: colIndex - 3.5,
                    z: rowIndex - 3.5,
                    key: `${rowIndex}-${colIndex}`
                });
            }
        });
    });

    return (
        <group>
            {pieces.map((p) => (
                <mesh key={p.key} position={[p.x, 0.5, p.z]}>
                    <boxGeometry args={[0.6, 1, 0.6]} />
                    <meshStandardMaterial color={p.color === 'w' ? '#fff' : '#222'} />
                </mesh>
            ))}
        </group>
    );
}

export default function ChessScene({ fen, orientation = 'white' }: ChessSceneProps) {
    return (
        <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <Canvas shadows camera={{ position: [0, 10, 5], fov: 45 }}>
                <color attach="background" args={['#1a1a1a']} />
                <Stage environment="city" intensity={0.6}>
                    <group rotation={[0, orientation === 'black' ? Math.PI : 0, 0]}>
                        <Board />
                        <Pieces fen={fen} />
                    </group>
                </Stage>
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
}
