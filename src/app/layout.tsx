import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { LayoutDashboard, Settings } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Goat Gang",
  description: "The ultimate community for Hay Day players. Join a neighborhood, participate in events, and win big!",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Goat Gang',
    title: 'Goat Gang - Join the Family',
    description: 'The ultimate community for Hay Day players. Join a neighborhood, participate in events, and win big!',
    images: [
      {
        url: '/logo.png', // Ideally this should be a wider 1200x630 og-image, but logo works for now
        width: 512,
        height: 512,
        alt: 'Goat Gang Logo',
      },
    ],
  },
  twitter: {
    card: 'summary', // using summary because we occupy a square logo
    title: 'Goat Gang',
    description: 'Join the Goat Gang family!',
    images: ['/logo.png'],
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";
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
            </main>
          </LazyMotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
