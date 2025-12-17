import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Find Hay Day Neighborhoods',
    description: 'Looking for an active Hay Day neighborhood? Browse our top-tier champion hoods, join a derby-focused team, and make new friends.',
};

export default function NeighborhoodsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
