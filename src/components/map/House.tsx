'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Gltf } from '@react-three/drei';
import * as THREE from 'three';

type HouseTier = 'Leader' | 'CoLeader' | 'Elder' | 'Member';

interface HouseProps {
    tier: HouseTier;
    position?: [number, number, number];
    scale?: number;
    onClick?: () => void;
    modelUrl?: string | null; // Optional external model
}

export default function House({ tier, position = [0, 0, 0], scale = 1, onClick, modelUrl }: HouseProps) {
    const mesh = useRef<THREE.Group>(null);

    // Floating animation removed for stability


    return (
        <group ref={mesh} position={position} scale={scale} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            {/* Shadow Blob - Always render shadow for grounding */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.0, 32]} />
                <meshBasicMaterial color="#000" transparent opacity={0.3} />
            </mesh>

            {/* Render External Model based on extension */}
            {modelUrl ? (
                <ExternalModel url={modelUrl} scale={scale * 0.5} />
            ) : (
                <>
                    {tier === 'Leader' && <LeaderManor />}
                    {tier === 'CoLeader' && <FarmBarn />}
                    {tier === 'Elder' && <Cottage />}
                    {tier === 'Member' && <LogCabin />}
                </>
            )}
        </group>
    );
}

// Wrapper to handle different file types (GLTF vs FBX)
export function ExternalModel({ url, scale }: { url: string; scale: number }) {
    const isFbx = url.toLowerCase().endsWith('.fbx');

    if (isFbx) {
        return <FbxLoader url={url} scale={scale} />;
    }

    // Default to GLTF
    return <Gltf src={url} scale={scale} position={[0, 0.5, 0]} />;
}

// FBX Loader Component
import { useFBX } from '@react-three/drei';
function FbxLoader({ url, scale }: { url: string; scale: number }) {
    // This hook suspends, so it needs to be inside a Suspense boundary usually, 
    // but R3F canvas handles that.
    const fbx = useFBX(url);
    // Clone to allow multiple instances
    const clone = React.useMemo(() => fbx.clone(), [fbx]);

    return <primitive object={clone} scale={scale * 0.01} position={[0, 0.5, 0]} />;
    // Note: FBX units are often cm, so scale * 0.01 might be needed, or just scale. 
    // Usually FBX comes in huge. I'll stick to 'scale' for now but might need adjustment.
    // actually, let's try raw scale first, usually users have to adjust scale in admin anyway?
    // User cannot adjust scale in admin yet? 
    // Let's use `scale` passed in (which is ~1.0). If FBX is huge, it will be huge. 
    // Better to apply a safety factor? No, let's trust the input scale for now.
}

// --- Specific Building Models (Procedural 3D) ---
// Note: We use detailed primitives because external GLTF URLs are unreliable.
// These are composed of multiple meshes to look like "Real" 3D assets.

function LeaderManor() {
    return (
        <group position={[0, 0, 0]}>
            {/* Main Body (Whitewashed) */}
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[1.8, 1.5, 1.2]} />
                <meshStandardMaterial color="#fdfaf3" />
            </mesh>
            {/* Roof (Slate Blue) */}
            <mesh position={[0, 1.8, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.5, 1.2, 4]} />
                <meshStandardMaterial color="#34495e" />
            </mesh>
            {/* Entrance Columns */}
            <mesh position={[0.5, 0.5, 0.65]}>
                <cylinderGeometry args={[0.1, 0.1, 1]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.5, 0.5, 0.65]}>
                <cylinderGeometry args={[0.1, 0.1, 1]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            {/* Door (Gold) */}
            <mesh position={[0, 0.4, 0.61]}>
                <planeGeometry args={[0.4, 0.8]} />
                <meshStandardMaterial color="#d4af37" />
            </mesh>
            {/* Chimney */}
            <mesh position={[0.6, 1.8, 0]}>
                <boxGeometry args={[0.3, 0.8, 0.3]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
        </group>
    );
}

function FarmBarn() {
    return (
        <group position={[0, 0, 0]}>
            {/* Main Barn (Classic Red) */}
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[1.4, 1.2, 1.8]} />
                <meshStandardMaterial color="#c0392b" />
            </mesh>
            {/* Roof (Curved/Gambrel approximation using Cylinder segment or plain prism) */}
            <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 1.8, 3]} /> {/* Triangular prism on side */}
                <meshStandardMaterial color="#ecf0f1" />
            </mesh>
            {/* Big Barn Door (White X) */}
            <mesh position={[0, 0.5, 0.91]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[0, 0.5, 0.92]}>
                <planeGeometry args={[0.7, 0.7]} />
                <meshBasicMaterial color="#3e2723" /> {/* Dark interior */}
            </mesh>
            {/* Silo Next to it */}
            <mesh position={[1, 0.7, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 1.4, 16]} />
                <meshStandardMaterial color="#95a5a6" metalness={1} roughness={0.5} />
            </mesh>
            <mesh position={[1, 1.6, 0]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial color="#bdc3c7" metalness={1} roughness={0.5} />
            </mesh>
        </group>
    );
}

function Cottage() {
    return (
        <group position={[0, 0, 0]}>
            {/* Blue Cottage Body */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.2, 1.0, 1.2]} />
                <meshStandardMaterial color="#3498db" />
            </mesh>
            {/* Thatch Roof (Yellowish/Brown) */}
            <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.1, 1.1, 4]} />
                <meshStandardMaterial color="#e67e22" />
            </mesh>
            {/* Flower Box */}
            <mesh position={[0, 0.2, 0.65]}>
                <boxGeometry args={[0.8, 0.2, 0.2]} />
                <meshStandardMaterial color="#27ae60" />
            </mesh>
        </group>
    );
}

function LogCabin() {
    return (
        <group position={[0, 0, 0]}>
            {/* Logs Body (Brown strips? Simplified to block for now) */}
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[1.0, 0.8, 1.0]} />
                <meshStandardMaterial color="#795548" /> {/* Wood Brown */}
            </mesh>
            {/* Green Roof */}
            <mesh position={[0, 1.0, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.9, 0.8, 4]} />
                <meshStandardMaterial color="#2e7d32" />
            </mesh>
            {/* Door */}
            <mesh position={[0, 0.3, 0.51]}>
                <planeGeometry args={[0.3, 0.5]} />
                <meshStandardMaterial color="#3e2723" />
            </mesh>
        </group>
    );
}
