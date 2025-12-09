import NoSSR from '@/components/NoSSR';

// ... imports remain the same ...

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    // ... existing logic ...

    if (!isAuthorized) {
        return null; // Router will handle redirect
    }

    return (
        <NoSSR>
            <div className="sticky top-0 z-40 bg-gray-900">
                <AdminNav />
            </div>
            {children}
        </NoSSR>
    );
}
