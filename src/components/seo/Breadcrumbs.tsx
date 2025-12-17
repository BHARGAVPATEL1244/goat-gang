import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    // Schema.org BreadcrumbList
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: `https://goat-gang.vercel.app${item.href}`
        }))
    };

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <li>
                    <Link href="/" className="hover:text-yellow-500 transition-colors flex items-center">
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={item.href} className="flex items-center space-x-2">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        {index === items.length - 1 ? (
                            <span className="font-medium text-gray-900 dark:text-white" aria-current="page">
                                {item.label}
                            </span>
                        ) : (
                            <Link href={item.href} className="hover:text-yellow-500 transition-colors">
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
