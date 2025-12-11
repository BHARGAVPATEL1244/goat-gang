'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Gltf, Environment } from '@react-three/drei';
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

function SuspenseModel({ url }: { url: string }) {
    return (
        <group>
            {/* Environment for Global Lighting */}
            <Environment preset="sunset" />

            {/* Fallback Ground Plane & Grid */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>
            <gridHelper args={[200, 200, 0xffffff, 0x000000]} position={[0, 0, 0]} />

            {/* Actual Model with Error Boundary */}
            <ThreeErrorBoundary fallback={
                <group position={[0, 2, 0]}>
                    <Text color="#ff0000" fontSize={0.8} anchorX="center" anchorY="middle" outlineWidth={0.05}>
                        City Model Missing
                    </Text>
                    <Text position={[0, -0.8, 0]} color="white" fontSize={0.4} anchorX="center" anchorY="top" outlineWidth={0.02} outlineColor="black">
                        Upload to: public{url}
                    </Text>
                </group>
            }>
                <Gltf src={url} />
            </ThreeErrorBoundary>
        </group>
    );
}
