import Breadcrumbs from '@/components/seo/Breadcrumbs';

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="py-8">
            <div className="max-w-4xl mx-auto mb-8 px-4 sm:px-0">
                <Breadcrumbs items={[{ label: 'Wiki & Guides', href: '/guides' }]} />
            </div>
            {children}
        </div>
    );
}
