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
import { useGLTF } from '@react-three/drei';

function SuspenseModel({ url }: { url: string }) {
    // Load model
    const { scene } = useGLTF('/models/desert_city/scene.gltf');

    return (
        <group>
            <Environment preset="park" />
            <ambientLight intensity={2} /> {/* Strong light */}

            {/* Sand Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#e6d2b5" roughness={1} />
            </mesh>

            {/* DEBUG CUBE: Reference point at 0,0,0 */}
            <mesh position={[0, 10, 0]}>
                <boxGeometry args={[5, 5, 5]} />
                <meshStandardMaterial color="red" />
            </mesh>

            {/* City Model - Try scaling down! often GLTFs are 100x size */}
            <primitive object={scene} scale={0.01} position={[0, 0, 0]} />

        </group>
    );
}
