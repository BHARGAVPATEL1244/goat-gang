'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Gltf, Environment } from '@react-three/drei';
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


function SuspenseModel({ url }: { url: string }) {
    // We ignore the `url` prop (which points to missing glb) and use existing FBX assets
    const inn = useLoader(FBXLoader, '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/Inn.fbx');
    const tower = useLoader(FBXLoader, '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/Bell_Tower.fbx');

    // Clone for reuse
    const innScene = useMemo(() => inn.clone(), [inn]);
    const towerScene = useMemo(() => tower.clone(), [tower]);

    return (
        <group>
            <Environment preset="sunset" />

            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#556b2f" /> {/* Greenish for grass */}
            </mesh>
            {/* Faint Grid */}
            <gridHelper args={[200, 20, 0xffffff, 0xffffff]} position={[0, 0.1, 0]} />

            {/* Central Inn (Town Hall) */}
            <primitive object={innScene} scale={0.05} position={[0, 0, 0]} />

            {/* Decor Tower */}
            <primitive object={towerScene} scale={0.05} position={[-15, 0, 10]} rotation={[0, 0.5, 0]} />

            {/* We can add more decorations later, this proves the concept without downloading anything */}
        </group>
    );
}
