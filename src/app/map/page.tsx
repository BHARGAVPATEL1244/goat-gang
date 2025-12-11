'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Sky, Text } from '@react-three/drei';
import HexGrid from '@/components/map/HexGrid';
import MemberVillage from '@/components/map/MemberVillage';
import MemberVillage3D from '@/components/map/MemberVillage3D';
import MemberVillage2D from '@/components/map/MemberVillage2D';
import { ThreeErrorBoundary } from '@/components/map/MapErrorBoundary';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Monitor, Image as ImageIcon, Grip } from 'lucide-react';

export default function MapPage() {
    // ... component code
    import MemberVillagewanted from '@/components/map/MemberVillageWanted';
    // ... inside MapPage component
    const [villageStyle, setVillageStyle] = useState<'GRID' | '3D' | '2D' | 'WANTED'>('WANTED'); // Default to Wanted

    // ... inside render loop
    {
        villageStyle === '3D' && (
            <MemberVillage3D
                hoodName={selectedDistrict?.name}
                members={villageMembers}
                onBack={exitVillage}
            />
        )
    }
    {
        villageStyle === '2D' && (
            <MemberVillage2D
                hoodName={selectedDistrict?.name}
                members={villageMembers}
                onBack={exitVillage}
            />
        )
    }
    {
        villageStyle === 'WANTED' && (
            /* Note: This component renders its own DOM UI, so we can't put it *inside* Canvas. 
               We must render it conditionally OUTSIDE the Canvas or use Html from drei, 
               but since it's a full page takeover, outside is better. */
            null
        )
    }
    {
        villageStyle === 'GRID' && (
            <MemberVillage
                hoodName={selectedDistrict?.name}
                members={villageMembers}
                onBack={exitVillage}
                leaderModel={selectedDistrict?.leader_model}
                coleaderModel={selectedDistrict?.coleader_model}
            />
        )
    }
    // ...

    return (
        <div className="w-full h-screen bg-gray-900 relative">
            {/* ... headers ... */}

            {/* RENDER WANTED WALL OUTSIDE CANVAS IF SELECTED */}
            {viewMode === 'VILLAGE' && villageStyle === 'WANTED' && (
                <div className="absolute inset-0 z-40 bg-[#3e2723]"> {/* High Z-index to cover canvas */}
                    <MemberVillagewanted
                        hoodName={selectedDistrict?.name}
                        members={villageMembers}
                        onBack={exitVillage}
                    />

                    {/* Re-add the style switcher overlay here because the main one might be hidden or z-indexed under */}
                    <div className="fixed top-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-auto">
                        <button onClick={exitVillage} className="bg-black/50 text-white px-6 py-3 rounded-full flex items-center gap-2 border border-white/20 font-bold">
                            <ArrowLeft className="w-5 h-5" /> Back to Map
                        </button>
                        <div className="bg-black/80 p-2 rounded-xl border border-white/10 backdrop-blur-md flex flex-col gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase text-center">View Style</span>
                            <button onClick={() => setVillageStyle('WANTED')} className="text-sm font-bold text-yellow-400 bg-white/10 px-3 py-2 rounded">🤠 Wanted Wall</button>
                            <button onClick={() => setVillageStyle('3D')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🧊 3D Scene</button>
                            <button onClick={() => setVillageStyle('2D')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🗺️ 2D Map</button>
                            <button onClick={() => setVillageStyle('GRID')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🕸️ Grid</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Scene - Hide or Unmount when in Wanted Mode to save performance? 
                Actually just keeping it mounted is fine, providing we don't render heavy stuff.
            */}
            <Canvas camera={{ position: [10, 10, 10], fov: 45 }} className={villageStyle === 'WANTED' ? 'hidden' : ''}>
                {/* ... existing canvas content ... */}
            </Canvas>
        </div>
    );

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
        setViewMode('MAP');
        setSelectedDistrict(null);
    };

    return (
        <div className="w-full h-screen bg-gray-900 relative">
            {/* UI Overlay */}
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

            {/* Back Button & Style Switcher for Village View */}
            {viewMode === 'VILLAGE' && (
                <div className="absolute top-6 right-6 z-30 flex flex-col gap-4 items-end pointer-events-auto">
                    <button
                        onClick={exitVillage}
                        className="bg-black/50 hover:bg-black/70 text-white px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur border border-white/20 transition-all font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Map
                    </button>

// ... imports
                    import MemberVillageHideout from '@/components/map/MemberVillageHideout';

                    // ... switch style state
                    const [villageStyle, setVillageStyle] = useState<'GRID' | '3D' | '2D' | 'WANTED' | 'HIDEOUT'>('HIDEOUT'); // Default to Hideout for new test

                    // ... in UI
                    <div className="bg-black/80 p-2 rounded-xl border border-white/10 backdrop-blur-md flex flex-col gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase text-center">View Style</span>
                        <button onClick={() => setVillageStyle('HIDEOUT')} className="text-sm font-bold text-green-400 bg-white/10 px-3 py-2 rounded">🏢 The Hideout</button>
                        <button onClick={() => setVillageStyle('WANTED')} className="text-sm text-yellow-400 hover:text-white px-3 py-2">🤠 Wanted Wall</button>
                        <button onClick={() => setVillageStyle('3D')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🧊 3D Scene</button>
                        <button onClick={() => setVillageStyle('2D')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🗺️ 2D Map</button>
                        <button onClick={() => setVillageStyle('GRID')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🕸️ Grid</button>
                    </div>
// ... in Rendering

                    {/* RENDER WANTED OR HIDEOUT OUTSIDE CANVAS */}
                    {viewMode === 'VILLAGE' && (
                        <>
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

                            {/* Navigation Overlay for these modes */}
                            {(villageStyle === 'WANTED' || villageStyle === 'HIDEOUT') && (
                                <div className="fixed top-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-auto">
                                    <button onClick={exitVillage} className="bg-black/50 text-white px-6 py-3 rounded-full flex items-center gap-2 border border-white/20 font-bold">
                                        <ArrowLeft className="w-5 h-5" /> Back to Map
                                    </button>
                                    {/* Re-render switcher here for convenience */}
                                    <div className="bg-black/80 p-2 rounded-xl border border-white/10 backdrop-blur-md flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase text-center">View Style</span>
                                        <button onClick={() => setVillageStyle('HIDEOUT')} className={`text-sm px-3 py-2 rounded ${villageStyle === 'HIDEOUT' ? 'font-bold text-green-400 bg-white/10' : 'text-gray-400'}`}>🏢 The Hideout</button>
                                        <button onClick={() => setVillageStyle('WANTED')} className={`text-sm px-3 py-2 rounded ${villageStyle === 'WANTED' ? 'font-bold text-yellow-400 bg-white/10' : 'text-gray-400'}`}>🤠 Wanted Wall</button>
                                        <button onClick={() => setVillageStyle('3D')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🧊 3D Scene</button>
                                        <button onClick={() => setVillageStyle('2D')} className="text-sm text-gray-400 hover:text-white px-3 py-2">🗺️ 2D Map</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* 3D Scene */}
                    <Canvas camera={{ position: [10, 10, 10], fov: 45 }} className={(villageStyle === 'WANTED' || villageStyle === 'HIDEOUT') ? 'hidden' : ''}>
                </div>
            )}

            {/* Selected Hood Detail Overlay (Only in MAP mode) */}
            {selectedDistrict && viewMode === 'MAP' && (
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

                        {selectedDistrict.derby_reqs_text && (
                            <div>
                                <h3 className="text-sm font-bold text-purple-500 uppercase mb-2">Derby Requirements</h3>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {selectedDistrict.derby_reqs_text}
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
            )}

            {/* 3D Scene */}
            <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
                <ThreeErrorBoundary fallback={
                    <group position={[0, 0, 0]}>
                        <Text color="red" fontSize={1}>
                            CRITICAL ERROR: CHECK CONSOLE
                        </Text>
                    </group>
                }>
                    <Suspense fallback={<Text position={[0, 0, 0]} color="white">Loading...</Text>}>
                        <Sky sunPosition={[100, 20, 100]} />
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} castShadow />

                        {viewMode === 'MAP' ? (
                            <HexGrid
                                districts={districts}
                                onHoodSelect={handleSelect}
                            />
                        ) : (
                            <>
                                {/* Render based on Style Selection */}
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
    );
}
