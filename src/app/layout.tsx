import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RoleDemoToolbar from '@/components/RoleDemoToolbar';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KaamSetu — Connecting Local Workers with Trusted Opportunities',
  description: 'India’s transparent two-sided local services marketplace connecting households with trusted maids, cooks, electricians, plumbers, carpenters, and technicians with digital work passports.',
  keywords: 'KaamSetu, local workers India, maid booking, electrician, plumber, carpenter, cook, home services, digital work passport, Delhi, Bangalore, Mumbai',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 flex flex-col min-h-screen">
        <RoleDemoToolbar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
