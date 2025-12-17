import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hay Day Discord & Trading',
    description: 'Join the largest Hay Day Discord server. Trade BEMs, SEMs, and LEMs instantly. Chat with thousands of farmers worldwide.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
