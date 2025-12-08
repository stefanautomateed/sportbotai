/**
 * Root Layout za BetSense AI aplikaciju
 * 
 * Ovo je glavni layout koji wrap-uje sve stranice.
 * Koristi Next.js 14 App Router - svaka stranica automatski koristi ovaj layout.
 * 
 * NAPOMENA: App Router je noviji i preporučeni pristup u Next.js 14.
 * Jednostavniji je za razumevanje jer se koristi file-based routing.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Učitavanje Inter fonta sa Google Fonts
const inter = Inter({ subsets: ['latin'] });

// SEO metadata for the entire application
export const metadata: Metadata = {
  title: {
    default: 'BetSense AI - AI-Powered Sports Betting Analysis',
    template: '%s | BetSense AI',
  },
  description: 'AI-powered analytical tool for sports betting. Educational tool for informed decision-making. Not a tipster service.',
  keywords: ['sports betting', 'AI analysis', 'betting analytics', 'sports prediction', 'educational tool'],
  authors: [{ name: 'BetSense AI' }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        {/* Flex container za sticky footer */}
        <div className="min-h-screen flex flex-col">
          <Header />
          
          {/* Main content - raste da popuni prostor */}
          <main className="flex-grow">
            {children}
          </main>
          
          <Footer />
        </div>
      </body>
    </html>
  );
}
