import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hay Day Events & Derby Guide',
    description: 'Track the latest Hay Day events, truck orders, boat events, and triple crop bonus days. Win big in the Weekly Derby!',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
