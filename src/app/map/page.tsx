'use client';

import React, { useState, useEffect } from 'react';
import HeroSelectCarousel from '@/components/map/HeroSelectCarousel';
import HeroSelectRoster from '@/components/map/HeroSelectRoster';
import { createClient } from '@/utils/supabase/client';
import { div } from 'framer-motion/client';

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
        </div>
    );
}
