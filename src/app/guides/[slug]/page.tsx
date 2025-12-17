import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
    params: { slug: string };
}

async function getGuide(slug: string) {
    const supabase = createClient();
    const { data } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
    return data;
}

// SEO: Generate dynamic metadata for each guide
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const guide = await getGuide(params.slug);
    if (!guide) return {};

    return {
        title: guide.title,
        description: guide.excerpt,
        openGraph: {
            title: guide.title,
            description: guide.excerpt,
            type: 'article',
            publishedTime: guide.created_at,
            modifiedTime: guide.updated_at,
        }
    };
}

export async function generateStaticParams() {
    const supabase = createClient();
    const { data: guides } = await supabase.from('wiki_pages').select('slug').eq('is_published', true);
    return guides?.map((guide) => ({
        slug: guide.slug,
    })) || [];
}

export default async function GuidePage({ params }: Props) {
    const guide = await getGuide(params.slug);

    if (!guide) {
        notFound();
    }

    // SEO: Article Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        datePublished: guide.created_at,
        dateModified: guide.updated_at,
        description: guide.excerpt,
        author: {
            '@type': 'Organization',
            name: 'Goat Gang'
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Link
                href="/guides"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Wiki
            </Link>

            <article className="prose prose-lg dark:prose-invert max-w-none">
                {guide.image_url && (
                    <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                        <img
                            src={guide.image_url}
                            alt={guide.title}
                            className="w-full h-auto object-cover max-h-[400px]"
                        />
                    </div>
                )}
                <h1 className="text-4xl font-extrabold mb-4">{guide.title}</h1>
                <div className="text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
                    Published on {new Date(guide.created_at).toLocaleDateString()}
                    {guide.updated_at !== guide.created_at && ` (Updated ${new Date(guide.updated_at).toLocaleDateString()})`}
                </div>

                <div
                    dangerouslySetInnerHTML={{ __html: guide.content }}
                    className="space-y-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-gray-900 [&>h2]:dark:text-white"
                />
            </article>
        </div>
    );
}
