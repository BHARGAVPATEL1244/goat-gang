'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Image } from '@react-three/drei';
import * as THREE from 'three';

// Placeholder for the "Painted Map"
const MAP_IMAGE_URL = '/images/map_bg.jpg';

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

    // In 2D mode, we just scatter pins on the flat plane
    // Or we could have defined "Slots" on the image 
    const assignments = useMemo(() => {
        return members.map((member, i) => {
            // Random scatter on the "Map"
            return {
                member,
                x: (Math.random() - 0.5) * 15,
                y: 0.1, // Slightly above image
                z: (Math.random() - 0.5) * 15
            };
        });
    }, [members]);

    return (
        <group>
            {/* The 2D Map Image treated as floor */}
            {/* 20x20 units size */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#ffffff" />
                {/* Texture would go here: map={texture} */}
            </mesh>

            {/* For now, using Drei Image to show placeholder if texture not loaded manually */}
            <Image url={MAP_IMAGE_URL} scale={[20, 20]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} opacity={0.5} transparent />


            {/* Pins/Houses on top of the map */}
            {assignments.map((item) => (
                <group key={item.member.id} position={[item.x, 0.5, item.z]}>
                    <mesh
                        onPointerOver={() => { setHoveredMember(item.member.id); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { setHoveredMember(null); document.body.style.cursor = 'auto'; }}
                    >
                        {/* Using a simple house shape as a "Game Piece" */}
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color={item.member.role === 'Leader' ? '#e74c3c' : '#bdc3c7'} />
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
            <group position={[0, 2, 10]} onClick={onBack}>
                <Billboard>
                    <Text fontSize={1} color="black" outlineWidth={0.1} outlineColor="white">
                        EXIT 2D MAP
                    </Text>
                </Billboard>
            </group>
        </group>
    );
}
