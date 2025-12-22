'use client';

import React, { useRef, useState } from 'react';
import { useGLTF, Text } from '@react-three/drei';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Chest } from '@/types/rpg';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

interface Chest3DProps {
    chest: Chest | null;
    position: [number, number, number];
    onClick?: () => void;
}

export function Chest3D({ chest, position, onClick }: Chest3DProps) {
    const group = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    // Animation for hover effect
    const { scale } = useSpring({
        scale: hovered ? 1.1 : 1,
        config: { tension: 300, friction: 10 }
    });

    // Determine color based on type
    const color = !chest ? '#3f3f46' : // Empty (Zinc-700)
        chest.type === 'GOLDEN' ? '#fbbf24' :
            chest.type === 'SILVER' ? '#94a3b8' :
                chest.type === 'LEGENDARY' ? '#a855f7' :
                    '#78350f'; // Wooden

    return (
        <animated.group
            ref={group}
            position={position}
            scale={scale}
            onPointerOut={() => setHovered(false)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            {/* Visual Mesh */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.4}
                    metalness={chest?.type === 'WOODEN' ? 0 : 0.6}
                    emissive={chest?.status === 'READY' ? color : 'black'}
                    emissiveIntensity={chest?.status === 'READY' ? 0.5 : 0}
                />
            </mesh>

            {/* Lid (Visual separation) */}
            <mesh position={[0, 1.05, 0]}>
                <boxGeometry args={[1.05, 0.1, 1.05]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} />
            </mesh>

            {/* Empty Slot Indicator */}
            {!chest && (
                <Text
                    position={[0, 1.5, 0]}
                    fontSize={0.3}
                    color="#52525b"
                    anchorX="center"
                    anchorY="middle"
                >
                    EMPTY
                </Text>
            )}

            {/* Status Text (Floating above) */}
            {chest && (
                <Text
                    position={[0, 2, 0]}
                    fontSize={0.25}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="black"
                >
                    {chest.status === 'UNLOCKING' ? 'OPENING...' :
                        chest.status === 'READY' ? 'READY!' :
                            chest.type}
                </Text>
            )}

            {/* Timer if Unlocking */}
            {chest?.status === 'UNLOCKING' && chest.unlockStartedAt && (
                <Text
                    position={[0, 1.7, 0]}
                    fontSize={0.2}
                    color="#fbbf24"
                    anchorX="center"
                    anchorY="middle"
                >
                    {Math.max(0, Math.floor(chest.unlockTime - ((Date.now() - chest.unlockStartedAt) / 1000)) / 60).toFixed(0)}m
                </Text>
            )}
        </animated.group>
    );
}
