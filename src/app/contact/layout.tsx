import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Join Discord',
    description: 'Connect with the community, trade, and chat on our Discord server.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
