import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Events & Derbies',
    description: 'Participate in Main Events, Mini Events, and Weekly Derby Championships.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
