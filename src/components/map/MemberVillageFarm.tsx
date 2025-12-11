'use client';

import React, { useMemo, useState } from 'react';
import { Text, Billboard, Environment, OrthographicCamera, useCursor, MapControls } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';

// --- ASSETS ---
const HOUSE_MODEL = '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/House_1.fbx'; // Member
const BARN_MODEL = '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/Stable.fbx';   // Leader/Co-Leader "Barn"
const SILO_MODEL = '/models/Medieval Village Pack - Dec 2020/Buildings/FBX/Mill.fbx';     // Elder "Silo"

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillageFarmProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
}

export default function MemberVillageFarm({ hoodName, members, onBack }: MemberVillageFarmProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    useCursor(!!hovered);

    // Load Models
    const houseModel = useLoader(FBXLoader, HOUSE_MODEL);
    const barnModel = useLoader(FBXLoader, BARN_MODEL);
    const siloModel = useLoader(FBXLoader, SILO_MODEL);

    // Clone & Tint Logic
    const getFarmHouse = (role: string) => {
        let model;
        let scale = 0.01;

        if (role === 'Leader' || role === 'CoLeader') {
            model = barnModel.clone();
            scale = 0.015; // Bigger Barn
            // Tint Red for Barn look
            model.traverse((child: any) => {
                if (child.isMesh) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map((m: any) => {
                            const newMat = m.clone();
                            if (newMat.name.toLowerCase().includes('wood') || newMat.name.toLowerCase().includes('plank')) {
                                newMat.color.setHex(0xa63c3c);
                            }
                            return newMat;
                        });
                    } else if (child.material && child.material.clone) {
                        child.material = child.material.clone();
                        if (child.material.name.toLowerCase().includes('wood') || child.material.name.toLowerCase().includes('plank')) {
                            child.material.color.setHex(0xa63c3c);
                        }
                    }
                }
            });
        } else if (role === 'Elder') {
            model = siloModel.clone();
            scale = 0.012;
        } else {
            model = houseModel.clone();
            scale = 0.01;
        }

        return { model, scale };
    };

    // Layout Logic: Layout in a Ring/Oval
    const farmLayout = useMemo(() => {
        return members.map((member, i) => {
            const angle = (i / members.length) * Math.PI * 2; // Full circle distribution
            const radiusX = 12; // Oval width
            const radiusZ = 8;  // Oval height

            const x = Math.cos(angle) * radiusX;
            const z = Math.sin(angle) * radiusZ;

            return { member, x, z, angle };
        });
    }, [members]);

    // Memoize tree placement so they don't jump around on re-renders (hover)
    const randomTrees = useMemo(() => {
        return [...Array(15)].map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const r = 15 + Math.random() * 15;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            return { i, x, z };
        });
    }, []);

    return (
        <group>
            {/* 1. Camera Setup for 2D/Isometric Look */}
            {/* Using MapControls for better panning in isometric view */}
            <MapControls
                enableRotate={false} /* Lock rotation for strict 2D feel? Or allow slight? User said 'like this' which is iso */
                enableZoom={true}
                minZoom={10}
                maxZoom={100}
            />
            <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={20} near={-100} far={500} onUpdate={c => c.lookAt(0, 0, 0)} />

            {/* DEBUG: Red Box at 0,0,0 to confirm render */}
            <mesh position={[0, 5, 0]}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="red" />
            </mesh>

            {/* 2. Lighting (Bright, sunny, cartoonish) */}
            <Environment preset="park" />
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />

            {/* 3. The Ground (Vibrant Green Farm) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#7ec850" roughness={0.8} />
            </mesh>

            {/* 4. Dirt Path Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <ringGeometry args={[9, 11, 64]} />
                <meshStandardMaterial color="#dbad76" roughness={1} />
            </mesh>

            {/* 5. Center Decor (Haystack pile or patch) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
                <circleGeometry args={[3, 32]} />
                <meshStandardMaterial color="#eaddcf" />
            </mesh>

            {/* 6. Buildings */}
            {farmLayout.map((item) => {
                const { model, scale } = getFarmHouse(item.member.role);
                const isHovered = hovered === item.member.id;

                return (
                    <group
                        key={item.member.id}
                        position={[item.x, 0, item.z]}
                        // Look at center-ish but offset slightly for isometric appeal
                        rotation={[0, -item.angle + Math.PI / 2, 0]}
                        onPointerOver={() => setHovered(item.member.id)}
                        onPointerOut={() => setHovered(null)}
                    >
                        <primitive
                            object={model}
                            scale={isHovered ? scale * 1.2 : scale}
                        />

                        {/* 7. Label (Wooden Sign Style) */}
                        <Billboard position={[0, 5, 0]}>
                            {/* Sign Backing */}
                            <mesh position={[0, 0, -0.1]}>
                                <boxGeometry args={[4.5, 1.5, 0.1]} />
                                <meshStandardMaterial color="#8b5a2b" /> {/* Dark Wood */}
                            </mesh>
                            {/* Sign Border */}
                            <mesh position={[0, 0, -0.15]}>
                                <boxGeometry args={[4.7, 1.7, 0.05]} />
                                <meshStandardMaterial color="#5d4037" />
                            </mesh>

                            <Text
                                fontSize={0.6}
                                color="#ffeb3b"
                                anchorY="middle"
                                outlineWidth={0.05}
                                outlineColor="#3e2723"
                            >
                                {item.member.name.replace(/\[.*?\]/g, '').trim()}
                            </Text>
                            <Text
                                fontSize={0.3}
                                color="#fff"
                                anchorY="top"
                                position={[0, -0.4, 0]}
                            >
                                {item.member.role.toUpperCase()}
                            </Text>
                        </Billboard>
                    </group>
                );
            })}
            {/* 8. Random Trees (Low Poly Cones) */}
            {randomTrees.map((tree) => (
                <group key={tree.i} position={[tree.x, 0, tree.z]}>
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.2, 0.4, 2, 8]} />
                        <meshStandardMaterial color="#5d4037" />
                    </mesh>
                    <mesh position={[0, 3, 0]}>
                        <coneGeometry args={[1.5, 4, 8]} />
                        <meshStandardMaterial color="#2d5a27" />
                    </mesh>
                </group>
            ))}

            {/* Exit Sign */}
            <group position={[0, 5, 15]} onClick={onBack}>
                <Billboard>
                    <mesh position={[0, 0, -0.1]}>
                        <boxGeometry args={[6, 2, 0.1]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                    <Text fontSize={1} color="white">
                        EXIT FARM
                    </Text>
                </Billboard>
            </group>

        </group>
    );
}
