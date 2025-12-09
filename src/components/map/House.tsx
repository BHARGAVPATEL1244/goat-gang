'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

type HouseTier = 'Leader' | 'CoLeader' | 'Elder' | 'Member';

interface HouseProps {
    tier: HouseTier;
    position: [number, number, number];
    scale?: number;
    onClick?: () => void;
}

// Visual Config for Tiers (Placeholder Geometries)
const TIER_CONFIG: Record<HouseTier, { color: string, height: number, distort: number }> = {
    Leader: { color: '#FFD700', height: 2.5, distort: 0.2 }, // Gold Mansion
    CoLeader: { color: '#DC143C', height: 1.8, distort: 0.1 }, // Red Farmhouse
    Elder: { color: '#4169E1', height: 1.2, distort: 0 }, // Blue Cottage
    Member: { color: '#8B4513', height: 0.8, distort: 0 } // Wood Cabin
};

export default function House({ tier, position, scale = 1, onClick }: HouseProps) {
    const mesh = useRef<THREE.Mesh>(null);
    const config = TIER_CONFIG[tier];

    useFrame((state) => {
        if (mesh.current && tier === 'Leader') {
            // Subtle rotation for Leader mansion
            mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group position={position} scale={scale} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            {/* The House Structure */}
            <mesh ref={mesh} position={[0, config.height / 2, 0]}>
                <boxGeometry args={[1, config.height, 1]} />
                <MeshDistortMaterial
                    color={config.color}
                    speed={2}
                    distort={config.distort}
                    roughness={0.2}
                />
            </mesh>

            {/* Roof (Cone) */}
            <mesh position={[0, config.height + 0.5, 0]}>
                <coneGeometry args={[0.8, 1, 4]} />
                <meshStandardMaterial color="#2d3436" />
            </mesh>

            {/* Base/Shadow */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshBasicMaterial color="#000" transparent opacity={0.2} />
            </mesh>
        </group>
    );
}
