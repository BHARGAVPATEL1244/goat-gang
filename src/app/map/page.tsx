'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Sky, Text } from '@react-three/drei';
import HexGrid from '@/components/map/HexGrid';
import MemberVillage from '@/components/map/MemberVillage';
import MemberVillage3D from '@/components/map/MemberVillage3D';
import MemberVillage2D from '@/components/map/MemberVillage2D';
// Import new DOM-based visualizations
import MemberVillagewanted from '@/components/map/MemberVillageWanted';
import MemberVillageHideout from '@/components/map/MemberVillageHideout';
import MemberVillageFarm from '@/components/map/MemberVillageFarm';

import { ThreeErrorBoundary } from '@/components/map/MapErrorBoundary';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Monitor, Image as ImageIcon, Grip } from 'lucide-react';

export default function MapPage() {
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'CITY' | 'VILLAGE'>('CITY');
    const [villageStyle, setVillageStyle] = useState<'GRID' | '3D' | '2D' | 'WANTED' | 'HIDEOUT' | 'FARM'>('FARM'); // Default to Farm for test
    const [villageMembers, setVillageMembers] = useState<any[]>([]);
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data } = await supabase.from('map_districts').select('*');
            if (data) setDistricts(data);
        }
        loadData();
    }, []);

    // Load members when entering village
    useEffect(() => {
        if (viewMode === 'VILLAGE' && selectedDistrict) {
            async function fetchMembers() {
                // If it's a real hood (Discord Role ID exists or hood_id)
                if (selectedDistrict.hood_id) {
                    const { data } = await supabase
                        .from('hood_memberships')
                        .select('*')
                        .eq('hood_id', selectedDistrict.hood_id);

                    if (data && data.length > 0) {
                        const realMembers = data.map(m => ({
                            id: m.user_id,
                            name: m.nickname || m.username || 'Member', // Fallback
                            role: m.rank
                        }));
                        setVillageMembers(realMembers);
                    } else {
                        // No synced members yet? Fallback to leader only or empty
                        setVillageMembers([
                            { id: 'leader', name: selectedDistrict.leader_name || 'Leader', role: 'Leader' }
                        ]);
                    }
                } else {
                    // Demo Mode (No ID)
                    setVillageMembers([
                        { id: '1', name: selectedDistrict.leader_name || 'Leader', role: 'Leader' },
                        { id: '2', name: 'Demo Member', role: 'Member' }
                    ]);
                }
            }
            fetchMembers();
        }
    }, [viewMode, selectedDistrict]);

    // Find full district object when ID is selected
    const handleSelect = (id: string) => {
        const d = districts.find(x => x.id === id);
        setSelectedDistrict(d || null);
    };

    const enterVillage = () => {
        setViewMode('VILLAGE');
    };

    const exitVillage = () => {
        setViewMode('CITY');
        setSelectedDistrict(null);
    };

    return (
        <div className="w-full h-screen bg-gray-900 relative">
            {/* UI Overlay (Title) */}
            <div className="absolute top-0 left-0 w-full z-10 p-6 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-white drop-shadow-md">
                            {viewMode === 'VILLAGE' ? selectedDistrict?.name : 'HOOD MAP'}
                        </h1>
                        <p className="text-blue-200 font-medium">
                            {viewMode === 'VILLAGE' ? 'Member Village' : 'Interactive Valley'}
                        </p>
                    </div>
                </div>
            </div>

            {/* DOM-BASED VISUALIZATIONS (WANTED WALL / HIDEOUT) */}
            {viewMode === 'VILLAGE' && (
                <>
                    {/* Render Content */}
                    {villageStyle === 'WANTED' && (
                        <div className="absolute inset-0 z-40 bg-[#3e2723]">
                            <MemberVillagewanted
                                hoodName={selectedDistrict?.name}
                                members={villageMembers}
                                onBack={exitVillage}
                            />
                        </div>
                    )}
                    {villageStyle === 'HIDEOUT' && (
                        <div className="absolute inset-0 z-40 bg-gray-900">
                            <MemberVillageHideout
                                hoodName={selectedDistrict?.name}
                                members={villageMembers}
                                onBack={exitVillage}
                            />
                        </div>
                    )}

                    {/* Navigation Overlay for DOM modes */}
                    {(villageStyle === 'WANTED' || villageStyle === 'HIDEOUT') && (
                        <div className="fixed top-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-auto">
                            {/* Back button handled by component internal back button usually, but duplication is fine for safety */}
                            {/* <button onClick={exitVillage} className="bg-black/50 text-white px-6 py-3 rounded-full flex items-center gap-2 border border-white/20 font-bold">
                                <ArrowLeft className="w-5 h-5" /> Back to Map
                            </button> */}

                            {/* Style Switcher */}
                            <div className="bg-black/80 p-2 rounded-xl border border-white/10 backdrop-blur-md flex flex-col gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase text-center">View Style</span>
                                <button onClick={() => setVillageStyle('HIDEOUT')} className={`text-sm px-3 py-2 rounded text-left ${villageStyle === 'HIDEOUT' ? 'font-bold text-green-400 bg-white/10' : 'text-gray-400'}`}>🏢 The Hideout</button>
                                <button onClick={() => setVillageStyle('WANTED')} className={`text-sm px-3 py-2 rounded text-left ${villageStyle === 'WANTED' ? 'font-bold text-yellow-400 bg-white/10' : 'text-gray-400'}`}>🤠 Wanted Wall</button>
                                <button onClick={() => setVillageStyle('3D')} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">🧊 3D Scene</button>
                                <button onClick={() => setVillageStyle('2D')} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">🗺️ 2D Map</button>
                                <button onClick={() => setVillageStyle('GRID')} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">🕸️ Grid</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 3D SCENE (CANVAS) */}
            {/* 3D Scene - Hide or Unmount when in Wanted/Hideout/Farm Mode to save performance? */}
            {/* 3D Scene Container - Hidden when in DOM modes */}
            <div className={`w-full h-full ${(['WANTED', 'HIDEOUT', 'FARM'].includes(villageStyle)) && viewMode === 'VILLAGE' ? 'hidden' : 'block'}`}>

                {/* Canvas Overlay UI (Back Button for 3D modes) */}
                {viewMode === 'VILLAGE' && !['WANTED', 'HIDEOUT', 'FARM'].includes(villageStyle) && (
                    <div className="absolute top-6 right-6 z-30 flex flex-col gap-4 items-end pointer-events-auto">
                        <button
                            onClick={exitVillage}
                            className="bg-black/50 hover:bg-black/70 text-white px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur border border-white/20 transition-all font-bold"
                        >
                            <ArrowLeft className="w-5 h-5" /> Back to Map
                        </button>
                        {/* Switcher for 3D modes */}
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-md flex flex-col gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase text-center">Map Style</span>
                            <button onClick={() => setVillageStyle('HIDEOUT')} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">🏢 Example 1</button>
                            <button onClick={() => setVillageStyle('WANTED')} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">🤠 Example 2</button>
                            <button onClick={() => setVillageStyle('FARM')} className="text-sm text-gray-400 hover:text-white px-3 py-2 text-left">🌾 The Farm</button>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button onClick={() => setVillageStyle('3D')} className={`text-sm px-3 py-2 rounded text-left ${villageStyle === '3D' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>🧊 3D Scene</button>
                            <button onClick={() => setVillageStyle('2D')} className={`text-sm px-3 py-2 rounded text-left ${villageStyle === '2D' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}>🗺️ 2D Map</button>
                            <button onClick={() => setVillageStyle('GRID')} className={`text-sm px-3 py-2 rounded text-left ${villageStyle === 'GRID' ? 'bg-gray-600 text-white' : 'text-gray-300'}`}>🕸️ Legacy (Grid)</button>
                        </div>
                    </div>
                )}

                <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
                    <ThreeErrorBoundary fallback={
                        <group position={[0, 0, 0]}>
                            <Text color="red" fontSize={1} anchorX="center" anchorY="middle">
                                CRITICAL ERROR: CHECK CONSOLE
                            </Text>
                        </group>
                    }>
                        <Suspense fallback={<Text position={[0, 0, 0]} color="white" anchorX="center" anchorY="middle">Loading 3D Assets...</Text>}>
                            <Sky sunPosition={[100, 20, 100]} />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} castShadow />

                            {viewMode === 'CITY' ? (
                                <HexGrid
                                    districts={districts}
                                    onHoodSelect={handleSelect}
                                />
                            ) : (
                                <>
                                    {/* Render based on Style Selection (3D/Canvas modes only) */}
                                    {villageStyle === '3D' && (
                                        <MemberVillage3D
                                            hoodName={selectedDistrict?.name}
                                            members={villageMembers}
                                            onBack={exitVillage}
                                        />
                                    )}
                                    {villageStyle === '2D' && (
                                        <MemberVillage2D
                                            hoodName={selectedDistrict?.name}
                                            members={villageMembers}
                                            onBack={exitVillage}
                                        />
                                    )}
                                    {villageStyle === 'GRID' && (
                                        <MemberVillage
                                            hoodName={selectedDistrict?.name}
                                            members={villageMembers}
                                            onBack={exitVillage}
                                            leaderModel={selectedDistrict?.leader_model}
                                            coleaderModel={selectedDistrict?.coleader_model}
                                        />
                                    )}
                                </>
                            )}

                            <OrbitControls
                                enablePan={true}
                                enableZoom={true}
                                minDistance={5}
                                maxDistance={50}
                                maxPolarAngle={Math.PI / 2.5}
                            />
                        </Suspense>
                    </ThreeErrorBoundary>
                </Canvas>
            </div>

            {/* Selected Hood Detail Overlay (Only in CITY mode) */}
            {
                selectedDistrict && viewMode === 'CITY' && (
                    <div className="absolute right-0 top-0 h-full w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 z-20 p-6 animate-in slide-in-from-right duration-300 overflow-y-auto">
                        <button
                            onClick={() => setSelectedDistrict(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-1">{selectedDistrict.name}</h2>
                        <p className="text-blue-400 text-sm font-medium mb-4">Leader: {selectedDistrict.leader_name || 'Unknown'}</p>

                        <div className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                {/* ... existing details ... */}
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Details</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs">Tag</span>
                                        <span className="text-white font-mono">{selectedDistrict.tag}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">Status</span>
                                        <span className="text-green-400">Recruiting</span>
                                    </div>
                                </div>
                            </div>

                            {selectedDistrict.hood_reqs_text && (
                                <div>
                                    <h3 className="text-sm font-bold text-yellow-500 uppercase mb-2">Hood Requirements</h3>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                        {selectedDistrict.hood_reqs_text}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={enterVillage}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                >
                                    🔍 VISIT VILLAGE
                                </button>
                                <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-green-900/20">
                                    JOIN HOOD
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
