'use client';

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import House from './House';

interface DistrictProps {
    q: number;
    r: number;
    type: 'Capital' | 'Expansion';
    hoodName?: string;
    onClick: () => void;
}

// Hay Day Palette
const COLORS = {
    capitalGround: '#76d655', // Bright Grass
    expansionGround: '#95e06c', // Lighter Grass
    border: '#5da642',
    side: '#5aa33d'
};

function HexTile({ q, r, type, hoodName, onClick }: DistrictProps) {
    // Convert Axial (q,r) to Cartesian (x,z)
    // Size = 2.0 (distance from center to corner)
    const SIZE = 2.0;
    const WIDTH = Math.sqrt(3) * SIZE;
    const HEIGHT = 2 * SIZE;

    // Spacing
    const x = WIDTH * (q + r / 2) * 1.05; // 1.05 for gap
    const z = HEIGHT * (3 / 4) * r * 1.05;

    const isCapital = type === 'Capital';
    const groundColor = isCapital ? COLORS.capitalGround : COLORS.expansionGround;

    return (
        <group position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {/* Hexagon Ground Top */}
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[SIZE, SIZE, 0.5, 6]} />
                <meshStandardMaterial color={groundColor} roughness={1} />
            </mesh>

            {/* Hexagon Ground Sides (Dirt/Darker Grass) */}
            <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[SIZE * 0.98, SIZE * 0.9, 0.5, 6]} />
                <meshStandardMaterial color="#5d4037" roughness={1} />
            </mesh>

            {/* Selection Highlight */}
            <lineSegments position={[0, 0.26, 0]}>
                <edgesGeometry args={[new THREE.CylinderGeometry(SIZE, SIZE, 0.5, 6)]} />
                <lineBasicMaterial color="#ffffff" transparent opacity={0.3} linewidth={1} />
            </lineSegments>

            {/* Central Building */}
            {hoodName && (
                <>
                    <House
                        tier={isCapital ? 'Leader' : 'CoLeader'}
                        position={[0, 0.25, 0]}
                        scale={isCapital ? 1.6 : 1.3}
                    />
                    <Html position={[0, 3.5, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
                        <div className={`
                            px-3 py-1.5 rounded-xl text-xs font-black border-2 shadow-[0_4px_0_rgba(0,0,0,0.2)]
                            transition-transform hover:scale-110 cursor-pointer whitespace-nowrap
                            ${isCapital
                                ? 'bg-yellow-400 border-yellow-600 text-yellow-900'
                                : 'bg-white border-gray-300 text-gray-700'}
                        `}>
                            {hoodName}
                        </div>
                    </Html>
                </>
            )}
        </group>
    );
}

interface HexGridProps {
    districts: any[];
    onHoodSelect: (hoodId: string) => void;
}

export default function HexGrid({ districts, onHoodSelect }: HexGridProps) {
    const gridData = useMemo(() => {
        if (districts.length > 0) return districts;

        // Default Demo Pattern (Central Cluster)
        return [
            { q: 0, r: 0, id: '1', name: 'Goat Gang Alpha', type: 'Capital' },
            { q: 1, r: -1, id: '2', name: 'Goat Meadows', type: 'Capital' },
            { q: -1, r: 1, id: '3', name: 'Goat Amity', type: 'Expansion' },
            { q: 1, r: 0, id: '4', name: 'Goat Chill', type: 'Expansion' },
            { q: 0, r: 1, id: '5', name: 'Goat Factory', type: 'Expansion' },
            { q: -1, r: 0, id: '6', name: 'Goat Bunker', type: 'Expansion' },
            { q: 0, r: -1, id: '7', name: 'Goat Outpost', type: 'Expansion' },
        ];
    }, [districts]);

    return (
        <group>
            {gridData.map((d: any) => (
                <HexTile
                    key={d.id}
                    q={d.q}
                    r={d.r}
                    type={d.type}
                    hoodName={d.name}
                    onClick={() => onHoodSelect(d.id)}
                />
            ))}
        </group>
    );
}
