'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Environment } from '@react-three/drei';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillage2DProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
}

export default function MemberVillage2D({ hoodName, members, onBack }: MemberVillage2DProps) {
    const [hoveredMember, setHoveredMember] = useState<string | null>(null);

    const assignments = useMemo(() => {
        return members.map((member, i) => {
            return {
                member,
                x: (Math.random() - 0.5) * 15,
                y: 0.1,
                z: (Math.random() - 0.5) * 15
            };
        });
    }, [members]);

    return (
        <group>
            {/* Lighting for the map */}
            <Environment preset="city" />

            {/* Parchment/Map Background Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <planeGeometry args={[25, 25]} />
                <meshStandardMaterial color="#f4e4bc" roughnes={1} /> {/* Parchment Color */}
            </mesh>

            {/* Map Border/Table */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[27, 27]} />
                <meshStandardMaterial color="#5d4037" /> {/* Wood dark brown */}
            </mesh>

            {/* Map Grid features */}
            <gridHelper args={[20, 10, 0x8b4513, 0xd2b48c]} position={[0, 0, 0]} />


            {/* Pins/Houses on top of the map */}
            {assignments.map((item) => (
                <group key={item.member.id} position={[item.x, 0.5, item.z]}>
                    <mesh
                        onPointerOver={() => { setHoveredMember(item.member.id); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { setHoveredMember(null); document.body.style.cursor = 'auto'; }}
                    >
                        {/* Token / Pawn piece */}
                        <cylinderGeometry args={[0.4, 0.6, 1, 16]} />
                        <meshStandardMaterial color={item.member.role === 'Leader' ? '#e74c3c' : '#3498db'} metalness={0.3} roughness={0.4} />
                    </mesh>

                    {/* Label */}
                    <Billboard position={[0, 1.5, 0]}>
                        <Text fontSize={0.6} color="black" outlineWidth={0.02} outlineColor="white" anchorY="bottom">
                            {item.member.name}
                        </Text>
                    </Billboard>
                </group>
            ))}

            {/* Signpost */}
            <group position={[0, 5, 12]} onClick={onBack}>
                <Billboard>
                    <Text fontSize={1} color="white" outlineWidth={0.1} outlineColor="black">
                        EXIT 2D MAP
                    </Text>
                </Billboard>
            </group>
        </group>
    );
}
