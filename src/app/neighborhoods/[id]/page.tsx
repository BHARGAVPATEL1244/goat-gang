import { createClient } from '@/utils/supabase/client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import HeroSelectRoster from '@/components/map/HeroSelectRoster';
import { createClient as createServerClient } from '@supabase/supabase-js'; // Use admin/public client for metadata if needed, but let's stick to client fetching for the body or server fetching for metadata

// We need a way to fetch data on the server for Metadata
async function getHood(id: string) {
    // Note: In a real Next.js Server Component, we should use a proper server client
    // For now, using the public URL/anon key pattern if possible, or just standard fetch if we have an API
    // Or we can just use the supabase-js client directly since this is server-side (node)

    // Using a direct fetch to Supabase REST API for simplicity in this context without setting up a full server client builder if not present
    // Actually, let's look at how other pages do it. They are "use client".
    // But for SEO (Metadata), we need server-side fetching.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Simple fetch
    const res = await fetch(`${supabaseUrl}/rest/v1/map_districts?hood_id=eq.${id}&select=*`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        },
        next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data[0];
}

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const hood = await getHood(params.id);

    if (!hood) {
        return {
            title: 'Neighborhood Not Found',
        };
    }

    return {
        title: `Join ${hood.name} | Hay Day Neighborhood`,
        description: `Join the ${hood.name} neighborhood in Hay Day. Leader: ${hood.leader_name}. Active in the Derby and Trading.`,
    };
}

export default async function NeighborhoodPage({ params }: Props) {
    const hood = await getHood(params.id);

    if (!hood) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Navbar is global, but we need padding */}
            <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <Breadcrumbs items={[
                    { label: 'Neighborhoods', href: '/neighborhoods' },
                    { label: hood.name, href: `/neighborhoods/${params.id}` }
                ]} />

                {/* Reuse the Roster Component but we need to fetch members first? 
                    HeroSelectRoster expects `members`.
                    For this static/server page, we probably want to fetch members too.
                */}

                {/* 
                    Since HeroSelectRoster is a presentational component, we can use it.
                    However, `HeroSelectRoster` might rely on client state or interactive "Back" buttons that expects to return to a carousel.
                    Let's check HeroSelectRoster. In Step 12448, it takes `onBack`.
                    We can pass a dummy onBack or wrapper.
                */}

                <div className="text-white">
                    <h1 className="text-4xl font-bold mb-4 text-yellow-500">{hood.name}</h1>
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <img src={hood.image_url || '/placeholder.png'} alt={hood.name} className="w-full rounded-2xl border border-gray-800" />
                        </div>
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
                                <h3 className="text-xl font-bold text-gray-400 mb-2">Leader</h3>
                                <p className="text-2xl text-white">{hood.leader_name}</p>
                            </div>
                            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
                                <h3 className="text-xl font-bold text-gray-400 mb-2">Status</h3>
                                <p className="text-green-400 font-bold">Recruiting</p>
                            </div>
                            <p className="text-gray-400 italic">
                                "{hood.description || 'Join our active neighborhood and win the Derby together!'}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
