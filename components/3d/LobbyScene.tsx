'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Sparkles, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { Hero } from './Hero';
import { Chest3D } from './Chest3D';
import { Chest } from '@/types/rpg';

interface LobbySceneProps {
    chests?: (Chest | null)[];
    selectedLeague?: string;
    onChestClick?: (index: number) => void;
}



function Pedestal() {
    return (
        <mesh position={[0, -1, 0]} receiveShadow>
            <cylinderGeometry args={[2, 2.2, 1, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
    );
}

export function LobbyScene({ chests = [null, null, null, null], selectedLeague = 'blitz', onChestClick }: LobbySceneProps) {
    const isNight = selectedLeague === 'blitz';

    return (
        <div className="w-full h-full relative">
            <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 2, 7]} fov={50} />

                {/* Lighting based on League */}
                <ambientLight intensity={isNight ? 0.2 : 0.6} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={isNight ? 2 : 1} castShadow color={selectedLeague === 'bullet' ? '#fbbf24' : 'white'} />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color={isNight ? '#4f46e5' : 'white'} />

                {/* Environment */}
                <Environment preset={selectedLeague === 'blitz' ? 'night' : selectedLeague === 'bullet' ? 'sunset' : 'park'} />

                {/* Background Elements */}
                {selectedLeague === 'blitz' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
                {selectedLeague === 'rapid' && <Cloud opacity={0.5} speed={0.4} position={[0, 5, -10]} />}

                {/* Main Hero */}
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={[0, 0.5, 0]}>
                    <Hero />
                </Float>

                <Pedestal />

                {/* 3D Chests Row */}
                <group position={[0, -1, 2]}>
                    {chests.map((chest, index) => (
                        <Chest3D
                            key={index}
                            chest={chest}
                            position={[(index - 1.5) * 1.5, 0, 0]} // Spread them out: -2.25, -0.75, 0.75, 2.25
                            onClick={() => onChestClick?.(index)}
                        />
                    ))}
                </group>

                {/* Particles */}
                <Sparkles
                    count={50}
                    scale={8}
                    size={4}
                    speed={0.4}
                    opacity={0.6}
                    color={selectedLeague === 'bullet' ? '#fbbf24' : selectedLeague === 'blitz' ? '#818cf8' : '#4ade80'}
                />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2.2}
                    minAzimuthAngle={-Math.PI / 4}
                    maxAzimuthAngle={Math.PI / 4}
                />
            </Canvas>
        </div>
    );
}
