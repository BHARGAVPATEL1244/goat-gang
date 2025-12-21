import Link from 'next/link';
import { createClient } from '@/utils/supabase/server'; // Use server client for server components
import { Metadata } from 'next';
import CategoryFilter from './CategoryFilter';

export const metadata: Metadata = {
    title: 'Hay Day Guides & Wiki | Goat Gang',
    description: 'Expert tips, tricks, and guides for Hay Day. Master the Derby, perfect your trading, and build the ultimate farm.',
};

interface Props {
    searchParams: Promise<{ category?: string }>;
}

export default async function GuidesIndexPage({ searchParams }: Props) {
    const { category } = await searchParams;
    const supabase = await createClient();

    let query = supabase
        .from('wiki_pages')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (category && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data: guides } = await query;

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
                    Hay Day <span className="text-yellow-500">Wiki & Guides</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Level up your farming game with our curated strategies.
                </p>
            </div>

            <CategoryFilter />

            <div className="grid gap-8 md:grid-cols-2">
                {guides?.map(guide => (
                    <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group">
                        <article className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:-translate-y-1 hover:shadow-xl h-full flex flex-col">
                            {guide.image_url && (
                                <div className="h-48 w-full relative">
                                    <img
                                        src={guide.image_url}
                                        alt={guide.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {guide.category && (
                                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                                            {guide.category}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="p-8 flex flex-col flex-grow">
                                <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors">
                                    {guide.title}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-6 flex-grow leading-relaxed line-clamp-3">
                                    {guide.excerpt}
                                </p>
                                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mt-auto">
                                    Read Guide &rarr;
                                </span>
                            </div>
                        </article>
                    </Link>
                ))}

                {(!guides || guides.length === 0) && (
                    <div className="col-span-2 text-center text-gray-500 py-12">
                        {category ? `No guides found in "${category}".` : 'No guides published yet. Check back soon!'}
                    </div>
                )}
            </div>
        </div>
    );
}
