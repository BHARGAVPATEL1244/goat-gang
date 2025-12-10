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

    return (
        <group>
            {/* Village Ground (Big Hex) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <cylinderGeometry args={[12, 12, 1, 6]} />
                <meshStandardMaterial color="#2d5a27" />
            </mesh>

            {/* Back Button (3D or handled by UI) */}
            {/* We assume UI handles the back button separately, but we put a signpost here */}
            <group position={[0, 2, -10]}>
                <Text fontSize={3} color="white" anchorX="center" anchorY="middle">
                    {hoodName}
                </Text>
            </group>

            {/* Houses */}
            {arrangedMembers.map((member, i) => {
                if (!member) return null; // Empty slot
                const pos = positions[i];
                return (
                    <group key={member.id || i} position={[pos.x, 0.5, pos.z]} rotation={[0, pos.r, 0]}>
                        <House tier={member.role} scale={i === 0 ? 1.2 : 0.8} position={[0, 0, 0]} />
                        {/* Name Tag */}
                        <Text position={[0, 2.5, 0]} fontSize={0.3} color="white" outlineWidth={0.02} outlineColor="black">
                            {member.name}
                        </Text>
                    </group>
                );
            })}
        </group>
    );
}
