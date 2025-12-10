'use client';

import React, { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import House, { ExternalModel } from './House';

// CUSTOM GLTF MODELS
// CUSTOM GLTF/FBX MODELS
const BASE_MODELS_PATH = '/models/Medieval Village Pack - Dec 2020/Buildings/FBX';
const PROPS_PATH = '/models/Medieval Village Pack - Dec 2020/Props/FBX';
const ROAD_MODEL = `${PROPS_PATH}/Path_Square.fbx`;

const LEADER_MODEL = `${BASE_MODELS_PATH}/Inn.fbx`; // Inn looks big and leader-like
const COLEADER_MODEL = `${BASE_MODELS_PATH}/Visual_House_VS_House_1.fbx`; // Fallback or House 1
const MEMBER_MODEL = `${BASE_MODELS_PATH}/House_1.fbx`; // Default simple house

// Helper to resolve short names to full paths
const resolveModelUrl = (shortName?: string) => {
    if (!shortName) return null;
    const map: Record<string, string> = {
        'castle': `${BASE_MODELS_PATH}/Inn.fbx`, // mapped Inn to castle keyword
        'market': `${BASE_MODELS_PATH}/Blacksmith.fbx`,
        'mill': `${BASE_MODELS_PATH}/Mill.fbx`,
        'watermill': `${BASE_MODELS_PATH}/Mill.fbx`, // Duplicate for now
        'watchtower': `${BASE_MODELS_PATH}/Bell_Tower.fbx`,
        'barracks': `${BASE_MODELS_PATH}/Blacksmith.fbx`, // Reusing Blacksmith
        'lumbermill': `${BASE_MODELS_PATH}/Sawmill.fbx`,
        'mine': `${PROPS_PATH}/Window_1.fbx`, // Placeholder, likely bad mapping but prevents crash
        'well': `${PROPS_PATH}/Well.fbx`,
        'archeryrange': `${BASE_MODELS_PATH}/Stable.fbx`,
        // New distinct ones
        'blacksmith': `${BASE_MODELS_PATH}/Blacksmith.fbx`,
        'inn': `${BASE_MODELS_PATH}/Inn.fbx`,
        'library': `${BASE_MODELS_PATH}/House_3.fbx`,
        'house': `${BASE_MODELS_PATH}/House_1.fbx`,
    };
    return map[shortName] || map['castle']; // Fallback
};

// ... Elder pool ...
const ELDER_MODELS = [
    `${BASE_MODELS_PATH}/Mill.fbx`,
    `${BASE_MODELS_PATH}/Stable.fbx`,
    `${BASE_MODELS_PATH}/Blacksmith.fbx`,
    `${BASE_MODELS_PATH}/House_3.fbx`,
    `${BASE_MODELS_PATH}/Bell_Tower.fbx`,
    `${BASE_MODELS_PATH}/Sawmill.fbx`
];

const getElderModel = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ELDER_MODELS.length;
    return ELDER_MODELS[index];
};

// Helper to calculate positions in a more city-like Grid/Spiral
const getVillagePositions = (count: number) => {
    const pos = [];
    pos.push({ x: 0, z: 0, r: 0 }); // Center Leader

    // Grid spacing
    const spacing = 5;
    let x = 0;
    let z = 0;
    let dx = 0;
    let dz = -1;
    let t = spacing;

    // Max interactions to avoid infinite loop fallback
    for (let i = 1; i < 40; i++) {
        // Spiral Step
        if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) {
            t = dx;
            dx = -dz;
            dz = t;
        }
        x += dx;
        z += dz;

        // Apply spacing
        const px = x * spacing;
        const pz = z * spacing;

        // Add some "organic" noise to offsets so it's not a perfect robot grid
        const noiseX = (Math.random() - 0.5) * 1.5;
        const noiseZ = (Math.random() - 0.5) * 1.5;

        // Random slight rotation for charm
        const rot = (Math.random() - 0.5) * 0.5;

        pos.push({ x: px + noiseX, z: pz + noiseZ, r: rot });
    }
    return pos;
};

// ... inside component ...



interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillageProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
    // New Props for Custom Models
    leaderModel?: string;
    coleaderModel?: string;
}

// Helper to parse name and level from "Name [Lvl] [Lvl2]"
const parseMemberName = (rawName: string) => {
    // 1. Extract Name (before first [)
    const nameMatch = rawName.split('[')[0].trim();

    // 2. Extract Levels (in [])
    const levelMatches = rawName.match(/\[(\d+)\]/g);
    let level = '';

    if (levelMatches && levelMatches.length > 0) {
        // Default to first level found
        // Logic for 2nd level requires knowing if this is the user's "2nd hood"
        // For now, we default to the first one as it's the safest assumption without cross-hood context
        level = levelMatches[0].replace('[', '').replace(']', '');
    }

    return { name: nameMatch || rawName, level };
};

export default function MemberVillage({ hoodName, members, onBack, leaderModel, coleaderModel }: MemberVillageProps) {
    // Use memo for grid/road positions to be efficient
    const { housePositions, roadPositions } = useMemo(() => {
        // Calculate Spiral House Positions
        const hPos = [];
        const rPos = [];
        const occupied = new Set<string>();

        // Center Leader
        hPos.push({ x: 0, z: 0, r: 0 });
        occupied.add(`0,0`);

        // Spiral Algorithm
        const spacing = 5;
        let x = 0;
        let z = 0;
        let dx = 0;
        let dz = -1;
        let t = spacing;

        // Generate houses
        for (let i = 1; i < 35; i++) { // Increased count to ensure enough spots
            if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) {
                t = dx; dx = -dz; dz = t;
            }
            x += dx; z += dz;

            // House Position
            const px = x * spacing;
            const pz = z * spacing;
            // Add noise
            const noiseX = (Math.random() - 0.5) * 1.5;
            const noiseZ = (Math.random() - 0.5) * 1.5;
            const rot = (Math.random() - 0.5) * 0.5;
            hPos.push({ x: px + noiseX, z: pz + noiseZ, r: rot });
            occupied.add(`${x},${z}`);
        }

        // Generate Roads - SOLID PLAZA GRID
        // We want a paved city look, so we pave everything within a certain radius
        const plazaRadius = 7; // Pave the center densely
        const roadSpacing = 3.5; // Match scale 3.5 roughly (FBX scale is tricky, trial and error) -> If scale 3.5, road tile is approx 3.5 units?
        // Logic: if scale 3.5, and original tile is ~100cm (1unit), then it's 3.5 units.
        // Let's assume tile covers 'roadSpacing'.

        for (let rx = -plazaRadius; rx <= plazaRadius; rx++) {
            for (let rz = -plazaRadius; rz <= plazaRadius; rz++) {
                // Check if distance is circular
                if (rx * rx + rz * rz > plazaRadius * plazaRadius) continue;

                // Skip if there's a house exactly here?
                // No, houses are placed on "grid units" of spacing 5.
                // Roads are spacing 3.5. They might clump.
                // Better visual hack: Just lay a huge paved floor instead of tiles?
                // Or tile effectively. Let's try tiling with spacing 3.0.

                rPos.push({
                    x: rx * 3.0,
                    z: rz * 3.0,
                    r: 0
                });
            }
        }

        return { housePositions: hPos, roadPositions: rPos };
    }, []);

    const [hoveredMember, setHoveredMember] = React.useState<string | null>(null);

    // Pre-calculate custom models if provided
    const customLeaderUrl = resolveModelUrl(leaderModel);
    const customCoLeaderUrl = resolveModelUrl(coleaderModel);

    // ... arrangedMembers logic ...
    const arrangedMembers = useMemo(() => {
        const slots = Array(housePositions.length).fill(null);
        const leader = members.find(m => m.role === 'Leader');
        if (leader) slots[0] = leader;
        let currentIndex = 1;
        members.filter(m => m.role !== 'Leader').forEach(m => {
            if (currentIndex < housePositions.length) slots[currentIndex++] = m;
        });
        return slots;
    }, [members, housePositions]);

    // ... decorations ...
    const decorations = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 6;
            return {
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                scale: 0.5 + Math.random() * 0.5,
                type: Math.random() > 0.3 ? 'tree' : 'rock',
                details: Math.random()
            };
        });
    }, []);


    const getModelForMember = (m: Member) => {
        if (m.role === 'Leader') return customLeaderUrl || LEADER_MODEL;
        if (m.role === 'CoLeader') return customCoLeaderUrl || COLEADER_MODEL;
        if (m.role === 'Elder') return getElderModel(m.id);
        return MEMBER_MODEL;
    };

    return (
        <group>
            {/* Ambient Environment - Expanded Ground for City */}
            <mesh receiveShadow position={[0, -0.1, 0]}>
                <cylinderGeometry args={[25, 25, 1, 64]} />
                <meshStandardMaterial color="#3b7d34" />
            </mesh>

            {/* Town Square (Center Paved Area) */}
            <mesh receiveShadow position={[0, 0, 0]}>
                <cylinderGeometry args={[6.5, 6.5, 1.1, 32]} />
                <meshStandardMaterial color="#5da642" />
            </mesh>



            {/* Back Button Signpost */}
            <group position={[0, 2, -8]} onClick={onBack} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[3, 1, 0.2]} />
                    <meshStandardMaterial color="#8d6e63" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 2]} />
                    <meshStandardMaterial color="#5d4037" />
                </mesh>
                <Text position={[0, 1, 0.11]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
                    EXIT VILLAGE
                </Text>
            </group>

            {/* Decorations using GLTF Models*/}
            {decorations.map((d, i) => (
                <group key={`deco-${i}`} position={[d.x, 0.5, d.z]} scale={d.scale}>
                    {d.type === 'tree' ? (
                        <TreeModel variant={i % 2} />
                    ) : (
                        <mesh position={[0, 0.2, 0]} rotation={[d.details, d.details, d.details]}>
                            <dodecahedronGeometry args={[0.6]} />
                            <meshStandardMaterial color="#7f8c8d" />
                        </mesh>
                    )}
                </group>
            ))}

            {/* Houses logic */}
            {arrangedMembers.map((member, i) => {
                if (!member) return null;
                const pos = housePositions[i];
                if (!pos) return null; // Safe guard
                const isLeader = member.role === 'Leader';
                const isHovered = hoveredMember === member.id;

                // Parse Name and Level
                const { name: displayName, level } = parseMemberName(member.name);

                // Determine Scale based on Role for Hierarchy
                let roleScale = 1.0;
                let nameTagHeight = 3.5;
                // Bumped up all scales slightly
                if (member.role === 'Leader') { roleScale = 2.0; nameTagHeight = 6.5; } // Leader still dominant
                else if (member.role === 'CoLeader') { roleScale = 1.6; nameTagHeight = 5.5; } // Big
                else if (member.role === 'Elder') { roleScale = 1.35; nameTagHeight = 4.5; } // Noticeable
                else { roleScale = 1.15; nameTagHeight = 4.0; } // Bigger base size

                return (
                    <group
                        key={member.id || i}
                        position={[pos.x, 0, pos.z]}
                        rotation={[0, pos.r + Math.PI, 0]}
                        onPointerOver={(e) => { e.stopPropagation(); setHoveredMember(member.id); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={(e) => { e.stopPropagation(); setHoveredMember(null); document.body.style.cursor = 'auto'; }}
                    >
                        {/* Note: Rotated +Math.PI to face center */}
                        <House
                            tier={member.role}
                            scale={roleScale}
                            position={[0, 0, 0]}
                            modelUrl={getModelForMember(member)}
                        />

                        {/* Name Tag - ONLY VISIBLE ON HOVER - Faces Camera */}
                        {isHovered && (
                            <Billboard
                                position={[0, nameTagHeight, 0]}
                                follow={true}
                                lockX={false}
                                lockY={false}
                                lockZ={false}
                            >
                                <mesh position={[0, 0, -0.1]}>
                                    <planeGeometry args={[displayName.length * 0.3 + 1, 1.2]} />
                                    <meshBasicMaterial color="black" transparent opacity={0.7} />
                                </mesh>
                                <Text
                                    fontSize={0.4}
                                    color="white"
                                    outlineWidth={0.02}
                                    outlineColor="black"
                                    anchorX="center"
                                    anchorY="middle"
                                    position={[0, 0.2, 0]}
                                >
                                    {displayName}
                                </Text>
                                <Text
                                    position={[0, -0.2, 0]}
                                    fontSize={0.25}
                                    color="#fbbf24"
                                    anchorX="center"
                                    anchorY="middle"
                                >
                                    {level ? `Lvl ${level}` : member.role.toUpperCase()}
                                </Text>
                            </Billboard>
                        )}
                    </group>
                );
            })}

            {/* Roads */}
            {roadPositions.map((r, i) => (
                <group key={`road-${i}`} position={[r.x, 0, r.z]} rotation={[0, r.r, 0]}>
                    <ExternalModel url={ROAD_MODEL} scale={3.5} />
                </group>
            ))}
        </group>
    );
}

// Reusable Tree Component (Defined Outside)
function TreeModel({ variant }: { variant: number }) {
    // Using high quality low poly tree assets
    return (
        <group>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 1]} />
                <meshStandardMaterial color="#5d4037" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <coneGeometry args={[1, 2, 8]} />
                <meshStandardMaterial color={variant === 0 ? "#2d5a27" : "#1b4d3e"} />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
                <coneGeometry args={[0.8, 1.5, 8]} />
                <meshStandardMaterial color={variant === 0 ? "#4caf50" : "#2ecc71"} />
            </mesh>
        </group>
    );
}
