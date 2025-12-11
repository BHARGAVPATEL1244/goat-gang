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
            <Environment preset="park" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />

            {/* Farm Lawn Base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[30, 30, 1]} /> {/* Use Box for thickness */}
                <meshStandardMaterial color="#5d9e44" roughness={0.8} /> {/* Nice Grass Green */}
            </mesh>

            {/* Dirt/Wood Table underneath */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
                <boxGeometry args={[32, 32, 0.5]} />
                <meshStandardMaterial color="#4e342e" /> {/* Dark Wood */}
            </mesh>

            {/* Map Grid features - Faint */}
            <gridHelper args={[30, 30, 0x3e5f30, 0x4f823f]} position={[0, 0.46, 0]} />


            {/* Pins/Houses on top of the map */}
            {assignments.map((item) => {
                const isLeader = item.member.role === 'Leader';
                const isCoLeader = item.member.role === 'CoLeader';
                const isElder = item.member.role === 'Elder';

                // Color Logic
                let color = '#ecf0f1'; // Member (White/Silver)
                if (isLeader) color = '#f1c40f'; // Gold
                if (isCoLeader) color = '#e67e22'; // Bronze/Orange
                if (isElder) color = '#9b59b6'; // Purple

                return (
                    <group key={item.member.id} position={[item.x, 0.5, item.z]}>
                        <mesh
                            position={[0, 0.5, 0]}
                            castShadow
                            onPointerOver={() => { setHoveredMember(item.member.id); document.body.style.cursor = 'pointer'; }}
                            onPointerOut={() => { setHoveredMember(null); document.body.style.cursor = 'auto'; }}
                        >
                            {/* Pawn Shape: Cylinder Body + Sphere Head */}
                            <cylinderGeometry args={[0.3, 0.5, 1.2, 32]} />
                            <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
                        </mesh>
                        <mesh position={[0, 1.3, 0]} castShadow>
                            <sphereGeometry args={[0.4, 32, 32]} />
                            <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
                        </mesh>

                        {/* Label */}
                        <Billboard position={[0, 2.5, 0]}>
                            {hoveredMember === item.member.id || isLeader ? (
                                <Text fontSize={0.7} color="white" outlineWidth={0.05} outlineColor="black" anchorY="bottom" font="/fonts/Inter-Bold.ttf">
                                    {item.member.name}
                                    {'\n'}
                                    <tspan fontSize={0.4} fill="#ddd">[{item.member.role}]</tspan>
                                </Text>
                            ) : (
                                <Text fontSize={0.5} color="white" outlineWidth={0.05} outlineColor="black" anchorY="bottom" fillOpacity={0.8}>
                                    {item.member.name}
                                </Text>
                            )}
                        </Billboard>
                    </group>
                );
            })}

            {/* Decorative Elements - Random Trees/Bushes (Low Poly) */}
            {[...Array(10)].map((_, i) => {
                const x = (Math.random() - 0.5) * 25;
                const z = (Math.random() - 0.5) * 25;
                // Don't overlap too much with center?
                return (
                    <group key={i} position={[x, 0.5, z]}>
                        <mesh position={[0, 0.5, 0]} castShadow>
                            <cylinderGeometry args={[0.1, 0.2, 1, 8]} />
                            <meshStandardMaterial color="#5d4037" />
                        </mesh>
                        <mesh position={[0, 1.5, 0]} castShadow>
                            <dodecahedronGeometry args={[0.8, 0]} />
                            <meshStandardMaterial color="#2ecc71" />
                        </mesh>
                    </group>
                )
            })}

            {/* Back Button (Floating UI handled by CSS, but keeping a 3D marker just in case) */}
        </group>
    );
}
