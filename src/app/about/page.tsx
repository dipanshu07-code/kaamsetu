'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, MapPin, Users, Award, AlertCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Our Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Building a Fairer Bridge for India’s Local Workforce
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          KaamSetu was founded with a singular conviction: Informal service workers deserve dignity, verifiable credentials, and 100% of their earned wages, while households deserve transparent pricing and verified accountability.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
        <h2 className="text-base font-extrabold text-slate-900">
          The Problem We Are Solving
        </h2>
        <p>
          In urban India, millions of skilled domestic helpers, cooks, plumbers, electricians, and carpenters operate entirely in the unorganized sector. When they work for corporate aggregator apps, up to 30% to 40% of their earnings are confiscated in commission fees, lead fees, and arbitrary penalty fines.
        </p>
        <p>
          Conversely, when households hire from the roadside or local intersections, they have no visibility into fair market rates, prior performance history, or verified identities.
        </p>
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 font-medium">
          KaamSetu provides the digital infrastructure for mutual trust — free of parasitic commission fees, with open rate cards and verifiable work passports.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <MapPin className="w-6 h-6 text-brand-800" />
          <strong className="text-slate-900 text-sm block">Pilot Locations</strong>
          <p className="text-slate-500 leading-relaxed">
            Currently operational in select residential hubs across Delhi NCR (South Delhi, Noida Sector 62, Gurugram), Bengaluru (Koramangala, HSR), Mumbai (Andheri), and Pune (Kothrud).
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <strong className="text-slate-900 text-sm block">Verification Philosophy</strong>
          <p className="text-slate-500 leading-relaxed">
            We verify phone authenticity, residential colony screening, and skill demonstrations. We never make reckless claims of 100% foolproof safety, because genuine safety requires community vigilance and clear grievance recourse.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <strong className="text-slate-900 text-sm block">Safeguarding Standards</strong>
          <p className="text-slate-500 leading-relaxed">
            High-risk categories like childcare remain paused until in-person biometric screening and child welfare protocols are fully certified.
          </p>
        </div>
      </div>
    </div>
  );
}
