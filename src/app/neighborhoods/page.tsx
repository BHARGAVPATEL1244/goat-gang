'use client';

import React, { useEffect, useState } from 'react';
import { NeighborhoodDB } from '@/lib/types';
import NeighborhoodCard from '@/components/NeighborhoodCard';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client'; // Added proper import

export default function NeighborhoodsPage() {
    const [neighborhoods, setNeighborhoods] = useState<NeighborhoodDB[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const supabase = createClient();
            const { data } = await supabase.from('map_districts').select('*');

            if (data) {
                // Adapt to NeighborhoodDB shape expected by Card
                const adapted = data.map((d: any) => ({
                    id: d.id.toString(), // Fix: Convert number ID to string
                    name: d.name || 'Unnamed',
                    image: d.image || '',
                    leader: d.leader_name || 'None',
                    tag: d.tag || '',
                    text_color: '#ffffff',
                    requirements: d.hood_reqs_text ? d.hood_reqs_text.split('\n') : [],
                    derby_requirements: d.derby_reqs_text ? d.derby_reqs_text.split('\n') : [],
                }));
                const sorted = adapted.sort((a: any, b: any) => a.name.localeCompare(b.name));
                setNeighborhoods(sorted);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Our Neighborhoods</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Choose your path. Whether you are a hardcore derby player or a casual farmer, we have a home for you.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {neighborhoods.map((hood, index) => (
                    <NeighborhoodCard key={hood.id} neighborhood={hood} index={index} />
                ))}
                {neighborhoods.length === 0 && (
                    <div className="text-center text-gray-500">No neighborhoods found. Check back soon!</div>
                )}
            </div>
        </div>
    );
}
