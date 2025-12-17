import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { LayoutDashboard, Settings } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Goat Gang',
    default: 'Goat Gang - #1 Hay Day Community',
  },
  description: "The #1 Hay Day community! Join active neighborhoods, trade expansion materials, chat with players, and win the Derby.",
  keywords: ['Hay Day', 'Hay Day Neighborhood', 'Hay Day Trading', 'Hay Day Discord', 'Hay Day Wiki', 'Supercell', 'Farm Game'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Goat Gang',
    title: 'Goat Gang - #1 Hay Day Community',
    description: 'The #1 Hay Day community! Join active neighborhoods, trade expansion materials, chat with players, and win the Derby.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Goat Gang Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Goat Gang - #1 Hay Day Community',
    description: 'The ultimate Hay Day community for trading and neighborhoods.',
    images: ['/logo.png'],
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import Navbar from "@/components/Navbar";
import { Toaster } from 'sonner';
import LazyMotionProvider from "@/components/LazyMotionProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LazyMotionProvider>
            <Toaster position="top-right" />
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
              <Analytics />
            </main>
          </LazyMotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
