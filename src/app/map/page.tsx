'use client';

import React, { useState, useEffect } from 'react';
import HeroSelectCarousel from '@/components/map/HeroSelectCarousel';
import HeroSelectRoster from '@/components/map/HeroSelectRoster';
import { createClient } from '@/utils/supabase/client';

export default function MapPage() {
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'CAROUSEL' | 'ROSTER'>('CAROUSEL');
    const [villageMembers, setVillageMembers] = useState<any[]>([]);
    const supabase = createClient();

    // 1. Load Districts (Hoods)
    useEffect(() => {
        async function loadData() {
            const { data } = await supabase.from('map_districts').select('*').order('member_count', { ascending: false });
            if (data) setDistricts(data);
        }
        loadData();
    }, []);

    // 2. Load Members when Roster is selected
    useEffect(() => {
        if (viewMode === 'ROSTER' && selectedDistrict) {
            async function fetchMembers() {
                if (selectedDistrict.hood_id) {
                    const { data } = await supabase
                        .from('hood_memberships')
                        .select('*')
                        .eq('hood_id', selectedDistrict.hood_id)
                        // Use a simple sort by rank for now via JS if DB view doesn't handle it
                        ;

                    if (data && data.length > 0) {
                        const realMembers = data.map(m => ({
                            id: m.user_id,
                            name: m.nickname || m.username || 'Member',
                            role: m.rank
                        }));

                        // Sort by Role Priority
                        const rolePriority: any = { 'Leader': 0, 'CoLeader': 1, 'Elder': 2, 'Member': 3 };
                        realMembers.sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));

                        setVillageMembers(realMembers);
                    } else {
                        setVillageMembers([
                            { id: 'leader', name: selectedDistrict.leader_name || 'Leader', role: 'Leader' }
                        ]);
                    }
                } else {
                    // Demo Mode
                    setVillageMembers([
                        { id: '1', name: selectedDistrict.leader_name || 'Leader', role: 'Leader' },
                        { id: '2', name: 'Demo Member', role: 'Member' }
                    ]);
                }
            }
            fetchMembers();
        }
    }, [viewMode, selectedDistrict]);

    // Handlers
    const handleSelectHood = (district: any) => {
        setSelectedDistrict(district);
        setViewMode('ROSTER');
    };

    const handleBack = () => {
        setViewMode('CAROUSEL');
        setSelectedDistrict(null);
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative">
            {viewMode === 'CAROUSEL' ? (
                <HeroSelectCarousel
                    districts={districts}
                    onSelect={handleSelectHood}
                />
            ) : (
                <HeroSelectRoster
                    hoodName={selectedDistrict?.name || 'Unknown'}
                    leaderName={selectedDistrict?.leader_name || 'Unknown'}
                    members={villageMembers}
                    onBack={handleBack}
                />
            )}
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

                            {
        selectedDistrict.hood_reqs_text && (
            <div>
                <h3 className="text-sm font-bold text-yellow-500 uppercase mb-2">Hood Requirements</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedDistrict.hood_reqs_text}
                </p>
            </div>
        )
    }

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
                        </div >
                    </div >
                )
}
        </div >
    );
}
