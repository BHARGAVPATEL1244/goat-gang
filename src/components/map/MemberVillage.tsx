'use client';

import React, { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import House, { ExternalModel } from './House';

// --- ASSET PATHS ---
const BASE_MODELS_PATH = '/models/Medieval Village Pack - Dec 2020/Buildings/FBX';
const PROPS_PATH = '/models/Medieval Village Pack - Dec 2020/Props/FBX';
const ROAD_MODEL = `${PROPS_PATH}/Path_Square.fbx`;

// Roles -> Models
const LEADER_MODEL = `${BASE_MODELS_PATH}/Inn.fbx`;
const COLEADER_MODEL = `${BASE_MODELS_PATH}/Visual_House_VS_House_1.fbx`;
const ELDER_MODELS = [
    `${BASE_MODELS_PATH}/Mill.fbx`,
    `${BASE_MODELS_PATH}/Stable.fbx`,
    `${BASE_MODELS_PATH}/Blacksmith.fbx`,
    `${BASE_MODELS_PATH}/House_3.fbx`,
    `${BASE_MODELS_PATH}/Bell_Tower.fbx`,
    `${BASE_MODELS_PATH}/Sawmill.fbx`
];
const MEMBER_MODEL = `${BASE_MODELS_PATH}/House_1.fbx`;

// --- GRID LAYOUT (11x11) ---
// X: Leader (Center/Plaza)
// C: Co-Leader (Close to center)
// E: Elder (Inner Ring)
// M: Member (Town blocks)
// R: Road
// P: Plaza (Paved)
// 0: Empty
// D: Decor (Market, Fountain)
const CITY_LAYOUT = [
    '00MMRMMRMM00',
    '0MMRMMRMM0',
    'MMEREEEREMM',
    'RRRPRRRPRRR',
    'MMCPXXXPCMM',
    'MMCPXXXPCMM',
    'MMCPXXXPCMM',
    'RRRPRRRPRRR',
    'MMEREEEREMM',
    '0MMRMMRMM0',
    '00MMRMMRMM00'
];

// Helper to resolve short names
const resolveModelUrl = (shortName?: string) => {
    if (!shortName) return null;
    const map: Record<string, string> = {
        'castle': `${BASE_MODELS_PATH}/Inn.fbx`,
        'market': `${BASE_MODELS_PATH}/Blacksmith.fbx`,
        'mill': `${BASE_MODELS_PATH}/Mill.fbx`,
        'watchtower': `${BASE_MODELS_PATH}/Bell_Tower.fbx`,
        'barracks': `${BASE_MODELS_PATH}/Blacksmith.fbx`,
        'lumbermill': `${BASE_MODELS_PATH}/Sawmill.fbx`,
        'mine': `${PROPS_PATH}/Window_1.fbx`,
        'blacksmith': `${BASE_MODELS_PATH}/Blacksmith.fbx`,
        'inn': `${BASE_MODELS_PATH}/Inn.fbx`,
        'house': `${BASE_MODELS_PATH}/House_1.fbx`,
    };
    return map[shortName] || map['castle'];
};

const getElderModel = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) { hash = id.charCodeAt(i) + ((hash << 5) - hash); }
    return ELDER_MODELS[Math.abs(hash) % ELDER_MODELS.length];
};

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillageProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
    leaderModel?: string;
    coleaderModel?: string;
}

// ---------------- ALGORITHM: GRID PARSER ----------------
const TILE_SIZE = 4.0; // Spacing

interface Spot {
    x: number;
    z: number;
    type: string;
    rotation: number;
}

const parseGrid = () => {
    const spots: Spot[] = [];
    const height = CITY_LAYOUT.length;
    const width = 11; // Approx max width
    const centerX = Math.floor(width / 2);
    const centerZ = Math.floor(height / 2);

    CITY_LAYOUT.forEach((row, rIndex) => {
        row.split('').forEach((char, cIndex) => {
            const x = (cIndex - centerX) * TILE_SIZE;
            const z = (rIndex - centerZ) * TILE_SIZE;

            // Basic Rotation Logic - Face Center
            let rotation = 0;
            // Roads might imply rotation (e.g. if road is below, face down)
            // For now, simplify: houses generally face inward or South
            if (z < 0) rotation = 0; // Top houses face down
            if (z > 0) rotation = Math.PI; // Bottom houses face up
            if (x < 0 && Math.abs(x) > Math.abs(z)) rotation = -Math.PI / 2; // Left face right
            if (x > 0 && Math.abs(x) > Math.abs(z)) rotation = Math.PI / 2; // Right face left

            // Special overrides
            if (char !== '0' && char !== ' ') {
                spots.push({ x, z, type: char, rotation });
            }
        });
    });
    return spots;
};


// ---------------- COMPONENT ----------------
export default function MemberVillage({ hoodName, members, onBack, leaderModel, coleaderModel }: MemberVillageProps) {

    // 1. Calculate Spots Once
    const gridSpots = useMemo(() => parseGrid(), []);

    // 2. Assign Members to Spots
    const { buildingAssignments, roadTiles, decorations } = useMemo(() => {
        const assignments: { member: Member | null; spot: Spot; model: string | null; scale: number; isFake?: boolean }[] = [];
        const roads: Spot[] = [];
        const decos: Spot[] = [];

        // Buckets for spots
        const leaderSpots = gridSpots.filter(s => s.type === 'X');
        const coLeaderSpots = gridSpots.filter(s => s.type === 'C');
        const elderSpots = gridSpots.filter(s => s.type === 'E');
        const memberSpots = gridSpots.filter(s => s.type === 'M');
        const decorSpots = gridSpots.filter(s => s.type === 'D' || s.type === 'P'); // P is also plaza so allows decor

        // Members
        const leader = members.find(m => m.role === 'Leader');
        const coLeaders = members.filter(m => m.role === 'CoLeader');
        const elders = members.filter(m => m.role === 'Elder');
        const regularMembers = members.filter(m => m.role === 'Member');

        // Assign Leader (Center)
        if (leader && leaderSpots.length > 0) {
            assignments.push({
                member: leader,
                spot: { ...leaderSpots[0], x: 0, z: 0 }, // Force dead center
                model: resolveModelUrl(leaderModel) || LEADER_MODEL,
                scale: 2.2
            });
        } else if (leaderSpots.length > 0) {
            // Fake Leader House if none
            assignments.push({ member: null, spot: { ...leaderSpots[0], x: 0, z: 0 }, model: LEADER_MODEL, scale: 2.2, isFake: true });
        }

        // Assign CoLeaders
        coLeaders.forEach((m, i) => {
            if (i < coLeaderSpots.length) {
                assignments.push({
                    member: m,
                    spot: coLeaderSpots[i],
                    model: resolveModelUrl(coleaderModel) || COLEADER_MODEL,
                    scale: 1.6
                });
            } else if (memberSpots.length > 0) {
                // Overflow to member spots
                const spot = memberSpots.shift();
                if (spot) assignments.push({ member: m, spot, model: COLEADER_MODEL, scale: 1.5 });
            }
        });

        // Assign Elders
        elders.forEach((m, i) => {
            if (i < elderSpots.length) {
                assignments.push({ member: m, spot: elderSpots[i], model: getElderModel(m.id), scale: 1.4 });
            } else if (memberSpots.length > 0) {
                const spot = memberSpots.shift();
                if (spot) assignments.push({ member: m, spot, model: getElderModel(m.id), scale: 1.3 });
            }
        });

        // Assign Members
        regularMembers.forEach((m) => {
            if (memberSpots.length > 0) {
                const spot = memberSpots.shift(); // Take next available
                if (spot) assignments.push({ member: m, spot, model: MEMBER_MODEL, scale: 1.1 });
            }
        });

        // Fill remaining Member/Elder spots with "NPC/Empty" houses to keep city dense
        // Using "isFake" to render without nametag
        [...memberSpots, ...elderSpots].forEach(spot => {
            // 30% chance to be empty plot, 70% chance to be a 'villager' house
            if (Math.random() > 0.3) {
                assignments.push({ member: null, spot, model: MEMBER_MODEL, scale: 1.0, isFake: true });
            }
        });

        // Roads
        gridSpots.filter(s => s.type === 'R' || s.type === 'P' || s.type === 'X').forEach(s => {
            // X and P are Plazas, imply road ground
            roads.push(s);
        });

        // Decor
        decorSpots.forEach(s => {
            // Randomly place market stall or fountain
            decos.push({ ...s, type: Math.random() > 0.5 ? 'market' : 'crate' });
        });

        return { buildingAssignments: assignments, roadTiles: roads, decorations: decos };
    }, [members, gridSpots, leaderModel, coleaderModel]);


    const [hoveredId, setHoveredId] = React.useState<string | null>(null);

    return (
        <group>
            {/* Ground */}
            <mesh receiveShadow position={[0, -0.1, 0]}>
                <cylinderGeometry args={[35, 35, 1, 64]} />
                <meshStandardMaterial color="#3b7d34" />
            </mesh>

            {/* Roads */}
            {roadTiles.map((r, i) => (
                <group key={`road-${i}`} position={[r.x, 0, r.z]} rotation={[0, r.rotation, 0]}>
                    <ExternalModel url={ROAD_MODEL} scale={3.5} />
                    {/* Add Plaza filler for P tiles to look solid */}
                    {(r.type === 'P' || r.type === 'X') && (
                        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[3.8, 3.8]} />
                            <meshStandardMaterial color="#6b5b4e" /> {/* Darker dirt/paving */}
                        </mesh>
                    )}
                </group>
            ))}

            {/* Buildings */}
            {buildingAssignments.map((item, i) => (
                <group
                    key={item.member?.id || `fake-${i}`}
                    position={[item.spot.x, 0, item.spot.z]}
                    rotation={[0, item.spot.rotation, 0]}
                    onPointerOver={(e) => {
                        if (item.member) { e.stopPropagation(); setHoveredId(item.member.id); document.body.style.cursor = 'pointer'; }
                    }}
                    onPointerOut={(e) => {
                        if (item.member) { e.stopPropagation(); setHoveredId(null); document.body.style.cursor = 'auto'; }
                    }}
                >
                    <House
                        tier={item.member?.role || 'Member'} // Fallback
                        scale={item.scale}
                        modelUrl={item.model!}
                    />

                    {/* Name Tag */}
                    {item.member && hoveredId === item.member.id && (
                        <Billboard position={[0, item.scale * 3.5, 0]}>
                            <mesh position={[0, 0, -0.1]}>
                                <planeGeometry args={[3, 1]} />
                                <meshBasicMaterial color="black" transparent opacity={0.7} />
                            </mesh>
                            <Text fontSize={0.4} color="white" anchorX="center" anchorY="middle">
                                {item.member.name}
                            </Text>
                            <Text position={[0, -0.3, 0]} fontSize={0.25} color="#fbbf24" anchorX="center" anchorY="middle">
                                {item.member.role}
                            </Text>
                        </Billboard>
                    )}
                </group>
            ))}

            {/* Decorations */}
            {decorations.map((d, i) => (
                <group key={`deco-${i}`} position={[d.x, 0, d.z]}>
                    {/* Simple geometric placeholders or props if available */}
                    {d.type === 'market' ? (
                        <ExternalModel url={`${PROPS_PATH}/MarketStand_1.fbx`} scale={1.5} />
                    ) : (
                        <ExternalModel url={`${PROPS_PATH}/Crate.fbx`} scale={1.2} />
                    )}
                </group>
            ))}

            {/* Signpost */}
            <group position={[0, 2, -18]} onClick={onBack}>
                {/* ... existing signpost code or simplified ... */}
                <Billboard position={[0, 2, 0]}>
                    <Text fontSize={1} color="white" outlineWidth={0.05} outlineColor="black">
                        EXIT CITY
                    </Text>
                </Billboard>
            </group>
        </group>
    );
}
