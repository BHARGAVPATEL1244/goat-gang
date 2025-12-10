'use client';

import React, { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import House from './House';

// CUSTOM GLTF MODELS
const BASE_MODELS_PATH = '/models/KayKit Medieval Builder Pack 1.0/Models/objects/gltf';

const LEADER_MODEL = `${BASE_MODELS_PATH}/castle.gltf.glb`;
const COLEADER_MODEL = `${BASE_MODELS_PATH}/watchtower.gltf.glb`;
const MEMBER_MODEL = `${BASE_MODELS_PATH}/house.gltf.glb`; // Default simple house

// Helper to resolve short names to full paths
const resolveModelUrl = (shortName?: string) => {
    if (!shortName) return null;
    const map: Record<string, string> = {
        'castle': `${BASE_MODELS_PATH}/castle.gltf.glb`,
        'market': `${BASE_MODELS_PATH}/market.gltf.glb`,
        'mill': `${BASE_MODELS_PATH}/mill.gltf.glb`,
        'watermill': `${BASE_MODELS_PATH}/watermill.gltf.glb`,
        'watchtower': `${BASE_MODELS_PATH}/watchtower.gltf.glb`,
        'barracks': `${BASE_MODELS_PATH}/barracks.gltf.glb`,
        'archeryrange': `${BASE_MODELS_PATH}/archeryrange.gltf.glb`,
        'keep': `${BASE_MODELS_PATH}/keep.gltf.glb`, // Need to verify if exists, fallback to castle
        'house': `${BASE_MODELS_PATH}/house.gltf.glb`,
    };
    return map[shortName] || map['castle']; // Fallback
};

// ... Elder pool ...
const ELDER_MODELS = [
    `${BASE_MODELS_PATH}/mill.gltf.glb`,
    `${BASE_MODELS_PATH}/archeryrange.gltf.glb`,
    `${BASE_MODELS_PATH}/barracks.gltf.glb`,
    `${BASE_MODELS_PATH}/watermill.gltf.glb`,
    `${BASE_MODELS_PATH}/watchtower.gltf.glb`,
    `${BASE_MODELS_PATH}/library.gltf.glb`
];

const getElderModel = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ELDER_MODELS.length;
    return ELDER_MODELS[index];
};

// Helper to calculate positions in a spiral/ring for the village
const getVillagePositions = (count: number, radius: number = 6) => { // Increased base radius from 4 to 6
    const pos = [];
    pos.push({ x: 0, z: 0, r: 0 }); // Center
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        // Spread inner ring slightly more
        pos.push({ x: Math.cos(angle) * (radius * 0.5), z: Math.sin(angle) * (radius * 0.5), r: -angle });
    }
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        // Outer ring spread out more
        pos.push({ x: Math.cos(angle) * (radius * 1.0), z: Math.sin(angle) * (radius * 1.0), r: -angle });
    }
    // Extra ring for overflow if needed
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + 0.2; // Offset
        pos.push({ x: Math.cos(angle) * (radius * 1.5), z: Math.sin(angle) * (radius * 1.5), r: -angle });
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
    const positions = useMemo(() => getVillagePositions(30), []);
    const [hoveredMember, setHoveredMember] = React.useState<string | null>(null);

    // Pre-calculate custom models if provided
    const customLeaderUrl = resolveModelUrl(leaderModel);
    const customCoLeaderUrl = resolveModelUrl(coleaderModel);

    // ... arrangedMembers logic ...
    const arrangedMembers = useMemo(() => {
        const slots = Array(30).fill(null);
        const leader = members.find(m => m.role === 'Leader');
        if (leader) slots[0] = leader;
        let currentIndex = 1;
        members.filter(m => m.role !== 'Leader').forEach(m => {
            if (currentIndex < 30) slots[currentIndex++] = m;
        });
        return slots;
    }, [members]);

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
            {/* Ambient Environment - Ground */}
            <mesh receiveShadow position={[0, -0.1, 0]}>
                <cylinderGeometry args={[15, 15, 1, 32]} />
                <meshStandardMaterial color="#3b7d34" />
            </mesh>

            {/* Village Green (Center) */}
            <mesh receiveShadow position={[0, 0, 0]}>
                <cylinderGeometry args={[4.5, 4.5, 1.1, 32]} />
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
                const pos = positions[i];
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
