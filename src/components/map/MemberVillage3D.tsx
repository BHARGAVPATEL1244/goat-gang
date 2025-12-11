'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Gltf, Environment, useGLTF } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import { ThreeErrorBoundary } from './MapErrorBoundary';

// Placeholder for the "High Quality City" model
const CITY_ENV_URL = '/models/city_env.glb';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillage3DProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
}

const POI_SPOTS = [
    { x: 0, y: 0, z: 0, label: 'Town Hall' },
    { x: 5, y: 0, z: 5, label: 'Barracks' },
    { x: -5, y: 0, z: 5, label: 'Stables' },
    { x: 5, y: 0, z: -5, label: 'Mill' },
    { x: -5, y: 0, z: -5, label: 'Forge' },
];

export default function MemberVillage3D({ hoodName, members, onBack }: MemberVillage3DProps) {
    const [hoveredMember, setHoveredMember] = useState<string | null>(null);

    const assignments = useMemo(() => {
        return members.map((member, i) => {
            const spot = POI_SPOTS[i] || {
                x: (Math.random() - 0.5) * 20,
                y: 0,
                z: (Math.random() - 0.5) * 20
            };
            return { member, ...spot };
        });
    }, [members]);

    return (
        <group>
            <SuspenseModel url={CITY_ENV_URL} />

            {assignments.map((item) => (
                <group key={item.member.id} position={[item.x, item.y + 2, item.z]}>
                    <mesh
                        onPointerOver={() => { setHoveredMember(item.member.id); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { setHoveredMember(null); document.body.style.cursor = 'auto'; }}
                    >
                        <sphereGeometry args={[0.5]} />
                        <meshStandardMaterial color={item.member.role === 'Leader' ? '#ffd700' : '#3498db'} />
                    </mesh>

                    <Billboard position={[0, 1, 0]}>
                        <Text fontSize={0.5} color="white" outlineWidth={0.05} outlineColor="black" anchorY="bottom">
                            {item.member.name}
                        </Text>
                        <Text position={[0, -0.4, 0]} fontSize={0.3} color="#fbbf24" anchorY="top">
                            {item.member.role}
                        </Text>
                    </Billboard>
                </group>
            ))}

            <group position={[0, 5, 10]} onClick={onBack}>
                <Billboard>
                    <Text fontSize={1} color="white" outlineWidth={0.1} outlineColor="red">
                        EXIT 3D MAP
                    </Text>
                </Billboard>
            </group>
        </group>
    );
}


// ... imports
// ... imports

function SuspenseModel({ hoodName, members }: { hoodName: string, members: Member[] }) {
    // Load Desert City Environment
    const { scene: cityScene } = useGLTF('/models/desert_city/scene.gltf?v=2');

    // Load Individual House Models
    const memberHouse = useLoader(FBXLoader, '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/House_1.fbx');
    const leaderHouse = useLoader(FBXLoader, '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/Inn.fbx');

    // Clone for usage
    const getHouse = (role: string) => {
        if (role === 'Leader') return leaderHouse.clone();
        if (role === 'CoLeader') return leaderHouse.clone(); // Use big house for CoLeaders too? Or maybe scale it down
        return memberHouse.clone();
    };

    // Procedural Layout Logic (Grid Clustering around Center)
    const placements = useMemo(() => {
        return members.map((member, i) => {
            // Spiral or Grid layout
            const angle = i * 1.5; // Spread out
            const radius = 5 + (i * 2); // Expanding spiral
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            return { member, x, z };
        });
    }, [members]);

    return (
        <group>
            <Environment preset="park" />
            <ambientLight intensity={1} />
            <directionalLight position={[50, 50, 25]} intensity={2} castShadow />

            {/* Huge Desert City Background (Scaled up largely to act as 'Terrain') */}
            <primitive object={cityScene} scale={10.0} position={[0, -1, 0]} />

            {/* Individual Member Houses */}
            {placements.map((item) => (
                <group key={item.member.id} position={[item.x, 0, item.z]}>
                    <primitive
                        object={getHouse(item.member.role)}
                        scale={item.member.role === 'Leader' ? 0.02 : 0.015}
                    />

                    {/* Floating Label */}
                    <Billboard position={[0, 8, 0]}>
                        <Text
                            fontSize={2}
                            color={item.member.role === 'Leader' ? "gold" : "white"}
                            outlineWidth={0.1}
                            outlineColor="black"
                            anchorY="bottom"
                        >
                            {item.member.name.split('[')[0].trim()}
                        </Text>
                        <Text
                            fontSize={1}
                            color="#ddd"
                            outlineWidth={0.05}
                            outlineColor="black"
                            anchorY="top"
                            position={[0, -0.5, 0]}
                        >
                            {item.member.role}
                        </Text>
                    </Billboard>
                </group>
            ))}
        </group>
    );
}
