import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://goat-gang.vercel.app';

    // Create a direct client for sitemap generation (no cookies needed for public data)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch Wiki Pages
    const { data: guides } = await supabase
        .from('wiki_pages')
        .select('slug, updated_at')
        .eq('is_published', true);

    // Fetch Neighborhoods
    // Note: checking valid ID column. Assuming 'id' is the standard UUID or INT PK.
    // If map_districts uses a different PK, we need to know. 
    // Based on previous context, we used `hood_id` in queries, but let's check if 'id' or 'hood_id' is the URL param.
    // In `src/app/neighborhoods/[id]/page.tsx` we used `params.id`.
    // In `getHood` we queried `hood_id=eq.${id}`. 
    // This implies `params.id` corresponds to the `hood_id` column.
    // So we should fetch `hood_id` to build the URL.
    const { data: hoods } = await supabase
        .from('map_districts')
        .select('hood_id, updated_at'); // Assuming key is hood_id based on previous file usage

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/neighborhoods`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/events`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/guides`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ];

    const guideRoutes: MetadataRoute.Sitemap = guides?.map(guide => ({
        url: `${baseUrl}/guides/${guide.slug}`,
        lastModified: new Date(guide.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
    })) || [];

    const hoodRoutes: MetadataRoute.Sitemap = hoods?.map(hood => ({
        url: `${baseUrl}/neighborhoods/${hood.hood_id}`, // Using hood_id as the URL slug
        lastModified: hood.updated_at ? new Date(hood.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
    })) || [];

    return [...staticRoutes, ...guideRoutes, ...hoodRoutes];
}
