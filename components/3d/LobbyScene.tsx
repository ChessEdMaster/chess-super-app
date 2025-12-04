'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function AvatarPlaceholder() {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1 + 0.5;
        }
    });

    return (
        <group ref={meshRef}>
            {/* Crown/Head */}
            <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.3, 0.5, 0.4, 8]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Body */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.4, 0.6, 1, 8]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.5} />
            </mesh>
            {/* Base */}
            <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.2, 16]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

function Pedestal() {
    return (
        <mesh position={[0, -1, 0]} receiveShadow>
            <cylinderGeometry args={[2, 2.2, 1, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
    );
}

export function LobbyScene() {
    return (
        <div className="w-full h-full relative">
            <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
                <color attach="background" args={['#020617']} />
                <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={50} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <Environment preset="city" />

                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <AvatarPlaceholder />
                </Float>

                <Pedestal />

                <Sparkles count={50} scale={5} size={2} speed={0.4} opacity={0.5} color="#fbbf24" />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
        </div>
    );
}
