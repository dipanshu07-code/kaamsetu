'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { dictionary } from '@/lib/utils';
import { 
  Menu, 
  X, 
  Briefcase, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  HardHat, 
  Calendar,
  LogOut,
  ChevronRight,
  Handshake
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, language, logout } = useAppStore();
  const dict = dictionary[language];

  const getDashboardHref = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'worker') return '/worker/dashboard';
    if (currentUser.role === 'admin') return '/admin';
    return '/customer/dashboard';
  };

  const getDashboardLabel = () => {
    if (!currentUser) return dict.navLogin;
    if (currentUser.role === 'worker') return 'Worker Portal';
    if (currentUser.role === 'admin') return 'Admin Dashboard';
    return 'Customer Portal';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-900 via-brand-800 to-teal-600 flex items-center justify-center text-white shadow-md shadow-brand-900/10 group-hover:scale-105 transition-transform">
              <Handshake className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-brand-900">
                  Kaam<span className="text-teal-600">Setu</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  India
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5 hidden sm:block">
                Connecting Local Workers with Trusted Opportunities
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-brand-800 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-brand-800 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            <Link
              href="/workers"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/workers') ? 'text-brand-800 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-brand-800 hover:bg-slate-50'
              }`}
            >
              {dict.navFindWorkers}
            </Link>

            <Link
              href="/how-it-works"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/how-it-works' ? 'text-brand-800 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-brand-800 hover:bg-slate-50'
              }`}
            >
              {dict.navHowItWorks}
            </Link>

            <Link
              href="/about"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/about' ? 'text-brand-800 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-brand-800 hover:bg-slate-50'
              }`}
            >
              {dict.navAbout}
            </Link>

            <Link
              href="/blueprint"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/blueprint' ? 'text-teal-800 bg-teal-50 font-semibold' : 'text-slate-600 hover:text-teal-800 hover:bg-slate-50'
              }`}
            >
              Blueprint
            </Link>

            <Link
              href="/worker/register"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 transition-colors flex items-center gap-1"
            >
              <HardHat className="w-4 h-4" />
              <span>{dict.navBecomeWorker}</span>
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href={getDashboardHref()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-800 text-white hover:bg-brand-900 transition-all shadow-sm flex items-center gap-2"
                >
                  {currentUser.role === 'worker' && <HardHat className="w-4 h-4 text-teal-300" />}
                  {currentUser.role === 'customer' && <Calendar className="w-4 h-4 text-brand-300" />}
                  {currentUser.role === 'admin' && <ShieldAlert className="w-4 h-4 text-amber-300" />}
                  <span>{getDashboardLabel()}</span>
                </Link>

                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {dict.navLogin}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={getDashboardHref()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-800 text-white"
            >
              {currentUser ? 'Portal' : 'Login'}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            href="/workers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            {dict.navFindWorkers}
          </Link>
          <Link
            href="/worker/register"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-teal-700 hover:bg-teal-50"
          >
            {dict.navBecomeWorker}
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            {dict.navHowItWorks}
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            {dict.navAbout}
          </Link>
          <Link
            href="/blueprint"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-teal-700 hover:bg-teal-50"
          >
            Business Blueprint
          </Link>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href={getDashboardHref()}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl font-semibold bg-brand-800 text-white"
            >
              {getDashboardLabel()}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
