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
                if (selectedDistrict.id) {
                    const { data } = await supabase
                        .from('hood_memberships')
                        .select('*')
                        .eq('hood_id', selectedDistrict.id) // Query by DB ID, not Discord Role ID
                        // Use a simple sort by rank for now via JS if DB view doesn't handle it
                        ;

                    if (data && data.length > 0) {
                        console.log('[ROSTER] Raw DB Members:', data);

                        // Helper to normalize DB roles to UI expectations
                        const normalizeRole = (rawRole: string): 'Leader' | 'CoLeader' | 'Elder' | 'Member' => {
                            if (!rawRole) return 'Member';
                            const lower = rawRole.toLowerCase().trim();

                            if (lower.includes('co') && lower.includes('leader')) return 'CoLeader'; // Matches co-leader, co_leader, coleader
                            if (lower.includes('leader')) return 'Leader';
                            if (lower.includes('elder')) return 'Elder';

                            return 'Member';
                        };

                        const realMembers = data.map(m => {
                            // Logic to parse levels: "[50][30] Name" -> [50, 30]
                            const name = m.nickname || m.username || 'Member';
                            const matches = name.match(/\[(\d+)\]/g);
                            const levels = matches ? matches.map((lvl: string) => parseInt(lvl.replace('[', '').replace(']', ''))) : [];

                            return {
                                id: m.user_id,
                                name: name,
                                role: normalizeRole(m.rank),
                                levels: levels
                            };
                        });

                        // Defined Hierarchy of "Hood Roles"
                        // 1. Meadows -> Level Index 0
                        // 2. Elysian -> Level Index 1
                        // 3. Springs -> Level Index 2 (or 1 if only 2 provided)
                        // Others -> Fallback logic
                        const HOOD_HIERARCHY = ['goat meadows', 'goat elysian', 'goat springs', 'goat creek'];
                        const currentHoodName = selectedDistrict.name.toLowerCase();

                        // Find which "Slot" this hood corresponds to
                        // If not found, defaults to -1 (will handle as fallback)
                        const hierarchyIndex = HOOD_HIERARCHY.findIndex(h => currentHoodName.includes(h));

                        const rolePriority: any = { 'Leader': 0, 'CoLeader': 1, 'Elder': 2, 'Member': 3 };

                        const getRelevantLevel = (levels: number[]) => {
                            if (levels.length === 0) return 0;

                            // If this hood is in our known list, try to grab that specific slot
                            if (hierarchyIndex !== -1) {
                                if (levels[hierarchyIndex] !== undefined) {
                                    return levels[hierarchyIndex];
                                }
                            }

                            // FALLBACKS:
                            // If we looked for Slot 1 (Elysian) but user only has [Level] (1 item), use that 1 item.
                            // If we are in a hood NOT in the list, use the last available level? Or first?
                            // User said "2nd one to 2nd hood role".
                            // Let's default to the *last* defined level if specific slot is missing?
                            // Or default to Main (0) if specific is missing.
                            return levels[0];
                        };

                        realMembers.sort((a, b) => {
                            // 1. Role Priority
                            const roleDiff = (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
                            if (roleDiff !== 0) return roleDiff;

                            // 2. Level Priority
                            const levelA = getRelevantLevel(a.levels);
                            const levelB = getRelevantLevel(b.levels);

                            if (levelB !== levelA) return levelB - levelA; // Descending Sort

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
                    leaderId={selectedDistrict?.leader_discord_id}
                    hoodImage={selectedDistrict?.image_url}
                    members={villageMembers}
                    onBack={handleBack}
                />
            )}
        </div>
    );
}
