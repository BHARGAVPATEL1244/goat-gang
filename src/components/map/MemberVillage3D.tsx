'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Gltf, Html } from '@react-three/drei';
import * as THREE from 'three';

// Placeholder for the "High Quality City" model
// Users will replace this URL with the actual GLB from Sketchfab/Kenney
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

// Fixed "Points of Interest" on the static map
// In a real scenario, these XYZs would be recorded by placing markers in Blender/Editor
const POI_SPOTS = [
    { x: 0, y: 0, z: 0, label: 'Town Hall' },   // 0: Leader
    { x: 5, y: 0, z: 5, label: 'Barracks' },    // 1: CoLeader
    { x: -5, y: 0, z: 5, label: 'Stables' },    // 2: CoLeader
    { x: 5, y: 0, z: -5, label: 'Mill' },       // 3: Elder
    { x: -5, y: 0, z: -5, label: 'Forge' },     // 4: Elder
    // ... generated spots for members
];

export default function MemberVillage3D({ hoodName, members, onBack }: MemberVillage3DProps) {
    const [hoveredMember, setHoveredMember] = useState<string | null>(null);

    // Assign members to spots
    const assignments = useMemo(() => {
        return members.map((member, i) => {
            // If we run out of fixed POIs, spiral out (fallback)
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
            {/* The Main City Environment Model */}
            {/* We use a primitive placeholder box if model is missing */}
            <SuspenseModel url={CITY_ENV_URL} />

            {/* Pins for Members */}
            {assignments.map((item) => (
                <group key={item.member.id} position={[item.x, item.y + 2, item.z]}>
                    {/* Pin Marker */}
                    <mesh
                        onPointerOver={() => { setHoveredMember(item.member.id); document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { setHoveredMember(null); document.body.style.cursor = 'auto'; }}
                    >
                        <sphereGeometry args={[0.5]} />
                        <meshStandardMaterial color={item.member.role === 'Leader' ? '#ffd700' : '#3498db'} />
                    </mesh>

                    {/* Label (Always visible or on hover?) - Let's do always visible for "Map" feel */}
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

            {/* Signpost Back */}
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

function SuspenseModel({ url }: { url: string }) {
    // Fallback if model load fails or URL is 404
    return (
        <group>
            {/* If model exists, Gltf will load it. If we anticipate 404, we might wrap in ErrorBoundary, 
             but for now we assume user puts file there. 
             If no file, it won't crash, just warn console. */}
            {/* We render a "Ground Plane" just in case model is missing */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#2c3e50" />
            </mesh>

            {/* Actual Model */}
            <Gltf src={url} />
        </group>
    );
}
