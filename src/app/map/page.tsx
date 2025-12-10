'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Sky } from '@react-three/drei';
import HexGrid from '@/components/map/HexGrid';
import { createClient } from '@/utils/supabase/client';

export default function MapPage() {
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data } = await supabase.from('map_districts').select('*');
            if (data) setDistricts(data);
        }
        loadData();
    }, []);

    // Find full district object when ID is selected
    const handleSelect = (id: string) => {
        const d = districts.find(x => x.id === id);
        setSelectedDistrict(d || null);
    };

    return (
        <div className="w-full h-screen bg-gray-900 relative">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full z-10 p-6 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-white drop-shadow-md">HOOD MAP</h1>
                        <p className="text-blue-200 font-medium">Interactive Valley</p>
                    </div>

                    {/* Search Bar Placeholder */}
                    {/* Removed search bar as per instruction, but keeping the div structure for context */}
                    {/* <div className="pointer-events-auto">
                        <input
                            type="text"
                            placeholder="Find a Hood..."
                            className="bg-black/40 text-white border border-white/20 rounded-full px-4 py-2 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div> */}
                </div>
            </div>

            {/* Selected Hood Detail Overlay */}
            {selectedDistrict && (
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

                        <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-green-900/20">
                            JOIN HOOD
                        </button>
                    </div>
                </div>
            )}

            {/* 3D Scene */}
            <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
                <Suspense fallback={null}>
                    <Sky sunPosition={[100, 20, 100]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow />

                    <HexGrid
                        districts={districts}
                        onHoodSelect={handleSelect}
                    />

                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        minDistance={5}
                        maxDistance={50}
                        maxPolarAngle={Math.PI / 2.5} // Prevent going below ground
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
