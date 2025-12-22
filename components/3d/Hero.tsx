'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Hero() {
    const group = useRef<THREE.Group>(null);

    // We try to load the model. If it doesn't exist, we might need error handling or just let it fail gracefully in development?
    // In R3F, useGLTF will throw if file not found. 
    // For this environment where user hasn't uploaded yet, we should use a Suspense fallback in the parent, 
    // BUT since we can't easily detect 404 inside the hook without crashing, 
    // we will implement a "safe" version or just use the Placeholder if we suspect it's missing?
    // We'll trust the user to add the file. 
    // To prevent white-screen crash now: I'll comment out the real load and use placeholder until confirmed.
    // user said: "no se com integrar-ho". So I will write the code to INTEGRATE it, but leave it commented or togglable.

    // UNCOMMENT THIS WHEN 'hero.glb' IS IN /public/models/
    // const { scene } = useGLTF('/models/hero.glb');

    useFrame((state) => {
        if (group.current) {
            // Floating animation
            group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
            group.current.rotation.y += 0.005;
        }
    });

    return (
        <group ref={group} dispose={null}>
            {/* <primitive object={scene} scale={2} /> */}

            {/* FALLBACK PLACEHOLDER (Remove when model is active) */}
            <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.3, 0.5, 0.4, 8]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.4, 0.6, 1, 8]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.2, 16]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

// Preload to avoid stutter
// useGLTF.preload('/models/hero.glb');
