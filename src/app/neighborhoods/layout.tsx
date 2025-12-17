import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Neighborhoods',
    description: 'Browse our top-tier neighborhoods and join the family.',
};

export default function NeighborhoodsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
