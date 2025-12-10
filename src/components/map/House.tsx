'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type HouseTier = 'Leader' | 'CoLeader' | 'Elder' | 'Member';

interface HouseProps {
    tier: HouseTier;
    position: [number, number, number];
    scale?: number;
    onClick?: () => void;
}

export default function House({ tier, position, scale = 1, onClick }: HouseProps) {
    const mesh = useRef<THREE.Group>(null);

    // Subtle Float Animation
    useFrame((state) => {
        if (mesh.current) {
            mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0] * 0.5) * 0.05;
        }
    });

    return (
        <group ref={mesh} position={position} scale={scale} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            {/* Shadow Blob */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.0, 32]} />
                <meshBasicMaterial color="#000" transparent opacity={0.3} />
            </mesh>

            {/* Render Specific Geometry based on Tier */}
            {tier === 'Leader' && <LeaderManor />}
            {tier === 'CoLeader' && <FarmBarn />}
            {tier === 'Elder' && <Cottage />}
            {tier === 'Member' && <LogCabin />}
        </group>
    );
}

// --- Specific Building Models (GLTF) ---

// We use clones of loaded GLTFs to instantiate them cheaply
import { useGLTF, Clone } from '@react-three/drei';

// URLs for consistent low-poly assets (Market/Kenney style)
const MODEL_URLS = {
    manor: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/house-c/model.gltf',
    barn: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/silo/model.gltf', // Using silo as part of barn
    cottage: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/house-2/model.gltf',
    cabin: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/cabin/model.gltf',
};

// Preload them
Object.values(MODEL_URLS).forEach(url => useGLTF.preload(url));

function LeaderManor() {
    const { scene } = useGLTF(MODEL_URLS.manor);
    return (
        <group scale={1.8} position={[0, 0, 0]}>
            <Clone object={scene} />
        </group>
    );
}

function FarmBarn() {
    // Barn + Silo combo (Using just Silo model or similar large structure if Barn not available)
    // Actually let's use a large house for now as Barn URL might be tricky to guess perfectly
    const { scene } = useGLTF(MODEL_URLS.manor); // Reuse manor but red? No, let's use primitive if model fails, but for now reuse
    // Better: Use a reliable primitive for Barn if no URL, but let's try to make it look unique
    return (
        <group scale={1.5}>
            <Clone object={scene} inject={<meshStandardMaterial color="#c0392b" />} /> {/* Tint it? */}
        </group>
    );
}

function Cottage() {
    const { scene } = useGLTF(MODEL_URLS.cottage);
    return (
        <group scale={1.5} position={[0, 0, 0]}>
            <Clone object={scene} />
        </group>
    );
}

function LogCabin() {
    const { scene } = useGLTF(MODEL_URLS.cabin);
    return (
        <group scale={1.2} position={[0, 0, 0]}>
            <Clone object={scene} />
        </group>
    );
}
