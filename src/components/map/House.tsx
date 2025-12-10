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

// Visual Config for Tiers
const TIER_CONFIG: Record<HouseTier, { bodyColor: string, roofColor: string, scaleY: number }> = {
    Leader: { bodyColor: '#f1c40f', roofColor: '#2c3e50', scaleY: 1.2 }, // Gold/Blue Manor
    CoLeader: { bodyColor: '#e74c3c', roofColor: '#ecf0f1', scaleY: 1.0 }, // Red/White Barn
    Elder: { bodyColor: '#3498db', roofColor: '#2c3e50', scaleY: 0.8 }, // Blue Cottage
    Member: { bodyColor: '#d35400', roofColor: '#f39c12', scaleY: 0.6 } // Wood Cabin
};

export default function House({ tier, position, scale = 1, onClick }: HouseProps) {
    const mesh = useRef<THREE.Group>(null);
    const config = TIER_CONFIG[tier];

    useFrame((state) => {
        if (mesh.current) {
            // Gentle floating animation
            mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.05;
        }
    });

    return (
        <group ref={mesh} position={position} scale={scale} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>

            {/* Shadow */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshBasicMaterial color="#000" transparent opacity={0.2} />
            </mesh>

            <group position={[0, 0.5 * config.scaleY, 0]}>
                {/* Main Body */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.2, 1 * config.scaleY, 1.2]} />
                    <meshStandardMaterial color={config.bodyColor} roughness={0.3} />
                </mesh>

                {/* Door */}
                <mesh position={[0, -0.2 * config.scaleY, 0.61]}>
                    <planeGeometry args={[0.3, 0.6 * config.scaleY]} />
                    <meshStandardMaterial color="#3e2723" />
                </mesh>

                {/* Windows */}
                <mesh position={[0.3, 0.1 * config.scaleY, 0.61]}>
                    <planeGeometry args={[0.25, 0.25]} />
                    <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.5} />
                </mesh>
                <mesh position={[-0.3, 0.1 * config.scaleY, 0.61]}>
                    <planeGeometry args={[0.25, 0.25]} />
                    <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.5} />
                </mesh>

                {/* Roof */}
                <mesh position={[0, 0.5 * config.scaleY + 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <coneGeometry args={[1.1, 0.8, 4]} />
                    <meshStandardMaterial color={config.roofColor} roughness={0.6} />
                </mesh>

                {/* Chimney */}
                {tier === 'Leader' && (
                    <mesh position={[0.4, 0.8 * config.scaleY, 0.4]}>
                        <boxGeometry args={[0.2, 0.6, 0.2]} />
                        <meshStandardMaterial color="#7f8c8d" />
                    </mesh>
                )}
            </group>
        </group>
    );
}
