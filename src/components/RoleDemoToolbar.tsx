'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { getSupabaseStatus } from '@/lib/supabase';
import { Shield, User, HardHat, RefreshCw, Globe, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RoleDemoToolbar() {
  const { currentUser, switchRole, language, setLanguage, resetToDefault } = useAppStore();
  const supabaseInfo = getSupabaseStatus();

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-300 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            KaamSetu Interactive Live Environment
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden md:inline text-[11px]">
            {supabaseInfo.configured ? '⚡ Cloud Supabase Active' : '📦 Interactive Client Storage Mode'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Switching Quick Pills */}
          <span className="text-slate-400 font-medium">Switch Role:</span>
          
          <button
            onClick={() => switchRole('customer')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              currentUser?.role === 'customer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Customer (Priya)</span>
          </button>

          <button
            onClick={() => switchRole('worker')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              currentUser?.role === 'worker'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HardHat className="w-3 h-3" />
            <span>Worker (Rameshwar)</span>
          </button>

          <button
            onClick={() => switchRole('admin')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              currentUser?.role === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admin Ops</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('Reset all bookings, reviews, and worker profiles back to initial demo dataset?')) {
                resetToDefault();
              }
            }}
            title="Reset to fresh demo data"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Language Toggle */}
          <div className="flex items-center border border-slate-700 rounded overflow-hidden ml-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 font-medium ${
                language === 'en' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 font-medium ${
                language === 'hi' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
