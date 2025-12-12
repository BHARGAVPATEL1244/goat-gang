'use client';

import React, { useState, useEffect } from 'react';
import HeroSelectCarousel from '@/components/map/HeroSelectCarousel';
import HeroSelectRoster from '@/components/map/HeroSelectRoster';
import { createClient } from '@/utils/supabase/client';
import { div } from 'framer-motion/client';

export default function NeighborhoodsPage() {
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'CAROUSEL' | 'ROSTER'>('CAROUSEL');
    const [villageMembers, setVillageMembers] = useState<any[]>([]);
    const supabase = createClient();

    // 1. Load Districts (Hoods)
    useEffect(() => {
        async function loadData() {
            const { data, error } = await supabase.from('map_districts').select('*').order('sort_order', { ascending: true });
            if (error) {
                console.error('Error loading districts:', error);
            }
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
                        const realMembers = data.map(m => {
                            // Logic to parse levels: "[50][30] Name" -> [50, 30]
                            const name = m.nickname || m.username || 'Member';
                            const matches = name.match(/\[(\d+)\]/g);
                            const levels = matches ? matches.map((lvl: string) => parseInt(lvl.replace('[', '').replace(']', ''))) : [];

                            return {
                                id: m.user_id,
                                name: name,
                                role: m.rank,
                                levels: levels
                            };
                        });

                        // Primary "High Tier" Hoods - Use 1st Level
                        const PRIMARY_HOODS = ['goat meadows', 'goat elysian', 'goat springs'];
                        const currentHoodName = selectedDistrict.name.toLowerCase();
                        const isPrimaryHood = PRIMARY_HOODS.some(ph => currentHoodName.includes(ph));

                        // Sort by Role Priority -> Level (Appropriate High/Low) -> Name
                        const rolePriority: any = { 'Leader': 0, 'CoLeader': 1, 'Elder': 2, 'Member': 3 };

                        const getRelevantLevel = (levels: number[]) => {
                            if (levels.length === 0) return 0;
                            if (levels.length === 1) return levels[0];

                            // If viewing a Primary Hood -> Use 1st Level
                            if (isPrimaryHood) return levels[0];

                            // If viewing any other Hood -> Use 2nd Level
                            return levels[1];
                        };

                        realMembers.sort((a, b) => {
                            // 1. Role Priority
                            const roleDiff = (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
                            if (roleDiff !== 0) return roleDiff;

                            // 2. Level Priority
                            const levelA = getRelevantLevel(a.levels);
                            const levelB = getRelevantLevel(b.levels);

                            if (levelB !== levelA) return levelB - levelA; // Descending Sort (Higher Level first)

                            // 3. Name Alphabetical
                            return a.name.localeCompare(b.name);
                        });

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
                    hoodImage={selectedDistrict?.image_url}
                    members={villageMembers}
                    onBack={handleBack}
                />
            )}
        </div>
    );
}
