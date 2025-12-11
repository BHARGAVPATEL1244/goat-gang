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
// ... imports

function SuspenseModel({ url }: { url: string }) {
    // Load model
    const result = useGLTF('/models/desert_city/scene.gltf?v=2');
    // Clone scene for multiple usages
    const scene1 = useMemo(() => result.scene.clone(), [result.scene]);
    const scene2 = useMemo(() => result.scene.clone(), [result.scene]);
    const scene3 = useMemo(() => result.scene.clone(), [result.scene]);

    return (
        <group>
            <Environment preset="park" />
            <ambientLight intensity={2} />

            {/* Sand Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#e6d2b5" roughness={1} />
            </mesh>

            {/* DEBUG CUBE (Center) */}
            <mesh position={[0, 10, 0]}>
                <boxGeometry args={[5, 5, 5]} />
                <meshStandardMaterial color="red" />
            </mesh>
            <Billboard position={[0, 14, 0]}>
                <Text fontSize={3} color="black" outlineWidth={0.1} outlineColor="white">CENTER RED CUBE</Text>
            </Billboard>

            {/* TEST 1: Tiny Scale (0.01) */}
            <group position={[-50, 0, 0]}>
                <Billboard position={[0, 20, 0]}>
                    <Text fontSize={5} color="blue" outlineWidth={0.2} outlineColor="white">SCALE 0.01</Text>
                </Billboard>
                <primitive object={scene1} scale={0.01} />
            </group>

            {/* TEST 2: Medium Scale (0.1) */}
            <group position={[0, 0, 30]}>
                <Billboard position={[0, 20, 0]}>
                    <Text fontSize={5} color="green" outlineWidth={0.2} outlineColor="white">SCALE 0.1</Text>
                </Billboard>
                <primitive object={scene2} scale={0.1} />
            </group>

            {/* TEST 3: Full Scale (1.0) */}
            <group position={[50, 0, 0]}>
                <Billboard position={[0, 20, 0]}>
                    <Text fontSize={5} color="purple" outlineWidth={0.2} outlineColor="white">SCALE 1.0</Text>
                </Billboard>
                <primitive object={scene3} scale={1.0} />
            </group>

        </group>
    );
}
