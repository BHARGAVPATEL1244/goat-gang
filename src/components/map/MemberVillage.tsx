'use client';

import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import House from './House';

// Helper to calculate positions in a spiral/ring for the village
const getVillagePositions = (count: number, radius: number = 4) => {
    const pos = [];
    // Captain/Leader in center
    pos.push({ x: 0, z: 0, r: 0 });

    // Inner ring (Co-Leaders/Elders)
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        pos.push({ x: Math.cos(angle) * (radius * 0.4), z: Math.sin(angle) * (radius * 0.4), r: -angle });
    }

    // Outer rings (Members)
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        pos.push({ x: Math.cos(angle) * (radius * 0.8), z: Math.sin(angle) * (radius * 0.8), r: -angle });
    }

    return pos;
};

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillageProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
}

export default function MemberVillage({ hoodName, members, onBack }: MemberVillageProps) {
    const positions = useMemo(() => getVillagePositions(30), []);

    // Fill slots with actual members, finding Leader for center
    const arrangedMembers = useMemo(() => {
        const slots = Array(30).fill(null);

        // Find Leader -> Slot 0
        const leader = members.find(m => m.role === 'Leader');
        if (leader) slots[0] = leader;

        let currentIndex = 1;
        members.filter(m => m.role !== 'Leader').forEach(m => {
            if (currentIndex < 30) slots[currentIndex++] = m;
        });

        return slots;
    }, [members]);

    // Generate random trees/rocks for decoration
    const decorations = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 6; // Outer ring
            return {
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                scale: 0.5 + Math.random() * 0.5,
                type: Math.random() > 0.3 ? 'tree' : 'rock',
                details: Math.random()
            };
        });
    }, []);

    return (
        <group>
            {/* Ambient Environment - Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
                <cylinderGeometry args={[15, 15, 1, 32]} />
                <meshStandardMaterial color="#3b7d34" />
            </mesh>

            {/* Village Green (Center) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
                <cylinderGeometry args={[4.5, 4.5, 1.1, 32]} />
                <meshStandardMaterial color="#5da642" />
            </mesh>

            {/* Dirt Path Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
                <ringGeometry args={[3.5, 4.5, 32]} />
                <meshStandardMaterial color="#d4a373" />
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

            {/* Houses (Existing Logic) */}
            {arrangedMembers.map((member, i) => {
                if (!member) return null;
                const pos = positions[i];
                const isLeader = member.role === 'Leader';

                return (
                    <group key={member.id || i} position={[pos.x, 0.5, pos.z]} rotation={[0, pos.r + Math.PI, 0]}>
                        {/* Note: Rotated +Math.PI to face center */}
                        <House
                            tier={member.role}
                            scale={isLeader ? 1.5 : 1.0}
                            position={[0, 0, 0]}
                        />

                        {/* Name Tag - Floating above */}
                        <group position={[0, isLeader ? 4 : 2.5, 0]}>
                            {/* Avatar/Icon Placeholder if URL exists (TODO) */}

                            <Text
                                fontSize={0.3}
                                color="white"
                                outlineWidth={0.04}
                                outlineColor="black"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {member.name}
                            </Text>
                            <Text
                                position={[0, -0.4, 0]}
                                fontSize={0.2}
                                color="#fbbf24"
                                outlineWidth={0.02}
                                outlineColor="black"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {member.role}
                            </Text>
                        </group>
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
