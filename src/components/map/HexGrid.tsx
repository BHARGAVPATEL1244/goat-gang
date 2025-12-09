'use client';

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import House from './House';

interface DistrictProps {
    q: number;
    r: number;
    type: 'Capital' | 'Expansion';
    hoodName?: string;
    onClick: () => void;
}

function HexTile({ q, r, type, hoodName, onClick }: DistrictProps) {
    // Convert Axial (q,r) to Cartesian (x,z)
    // Size = 2.0 (distance from center to corner)
    const SIZE = 2.0;
    const WIDTH = Math.sqrt(3) * SIZE;
    const HEIGHT = 2 * SIZE;

    // Spacing
    const x = WIDTH * (q + r / 2) * 1.05; // 1.05 for gap
    const z = HEIGHT * (3 / 4) * r * 1.05;

    const color = type === 'Capital' ? '#2ecc71' : '#27ae60';

    return (
        <group position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {/* Hexagon Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[SIZE, SIZE, 0.5, 6]} />
                <meshStandardMaterial color={color} roughness={0.8} />
                {/* Visual Border */}
                <lineSegments>
                    <edgesGeometry args={[new THREE.CylinderGeometry(SIZE, SIZE, 0.5, 6)]} />
                    <lineBasicMaterial color="#1e8449" linewidth={2} />
                </lineSegments>
            </mesh>

            {/* Central Building (Representation of the Hood) */}
            {hoodName && (
                <>
                    <House
                        tier={type === 'Capital' ? 'Leader' : 'CoLeader'}
                        position={[0, 0.25, 0]}
                        scale={1.5}
                    />
                    <Html position={[0, 4, 0]} center distanceFactor={10}>
                        <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap backdrop-blur-sm border border-white/20">
                            {hoodName}
                        </div>
                    </Html>
                </>
            )}
        </group>
    );
}

import * as THREE from 'three';

interface HexGridProps {
    districts: any[]; // To be typed properly with DB data
    onHoodSelect: (hoodId: string) => void;
}

export default function HexGrid({ districts, onHoodSelect }: HexGridProps) {
    // If no districts, show a demo grid
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
