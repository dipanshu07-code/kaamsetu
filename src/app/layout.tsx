import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import '@fontsource-variable/inter';
import '@fontsource/noto-sans-devanagari/devanagari-400.css';
import '@fontsource/noto-sans-devanagari/devanagari-600.css';
import '@fontsource/noto-sans-devanagari/devanagari-700.css';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoBanner from '@/components/DemoBanner';

export const metadata: Metadata = {
  title: 'KaamSetu — Local repairs and local jobs',
  description:
    'Book nearby plumbers, electricians and helpers for repairs, or find full-time, contract and daily-wage jobs near you. Available in English and Hindi.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (await cookies()).get('ks_lang')?.value === 'hi' ? 'hi' : 'en';
  return (
    <html lang={lang}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-stone-900 antialiased">
        <Providers initialLang={lang}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
            Skip to main content / मुख्य हिस्से पर जाएँ
          </a>
          <DemoBanner />
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
