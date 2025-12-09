'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Sky } from '@react-three/drei';
import HexGrid from '@/components/map/HexGrid';
import { Loader2 } from 'lucide-react';

export default function MapPage() {
    const [selectedHood, setSelectedHood] = useState<string | null>(null);

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
                    <div className="pointer-events-auto">
                        <input
                            type="text"
                            placeholder="Find a Hood..."
                            className="bg-black/40 text-white border border-white/20 rounded-full px-4 py-2 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Selected Hood Detail Overlay */}
            {selectedHood && (
                <div className="absolute right-0 top-0 h-full w-80 bg-black/80 backdrop-blur-xl border-l border-white/10 z-20 p-6 animate-in slide-in-from-right duration-300">
                    <button
                        onClick={() => setSelectedHood(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">Selected Hood</h2>
                    <p className="text-gray-400">ID: {selectedHood}</p>
                    <div className="mt-8 space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h3 className="text-sm font-bold text-gray-300 uppercase">Tags</h3>
                            <p className="text-white">#XYZ123</p>
                        </div>
                        <button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors">
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
                        districts={[]}
                        onHoodSelect={setSelectedHood}
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
