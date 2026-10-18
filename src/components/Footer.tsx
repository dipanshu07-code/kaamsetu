'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  FileText, 
  HeartHandshake,
  ExternalLink 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Important Trust & Safeguarding Disclaimer Banner */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-slate-300">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white text-sm mb-1">
              Trust & Transparency Policy
            </h4>
            <p className="text-slate-400 leading-relaxed">
              KaamSetu facilitates transparent discovery and direct engagement between local households and independent service workers. 
              We distinguish strictly between self-reported experience and platform-verified credentials. Verification badges indicate verified phone and background assessment; they do not guarantee safety or work outcomes. Childcare services remain paused in accordance with platform safeguarding principles.
            </p>
          </div>
          <Link
            href="/grievance"
            className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <span>Grievance Center</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Footer Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-900 font-bold">
                KS
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Kaam<span className="text-teal-400">Setu</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Connecting Local Workers with Trusted Opportunities. Empowering domestic helpers, technicians, and artisans across Indian cities with transparent pricing and a portable Digital Work Passport.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Pilot Operations: Delhi NCR, Bengaluru, Mumbai, Pune</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400" />
                <span>Helpline: +91 11 4050 8899 (Mon–Sat, 9 AM – 7 PM IST)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400" />
                <span>support@kaamsetu.org.in</span>
              </div>
            </div>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Local Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/workers?category=maid-housekeeping" className="hover:text-teal-400 transition-colors">
                  Maid & Housekeeping
                </Link>
              </li>
              <li>
                <Link href="/workers?category=cook" className="hover:text-teal-400 transition-colors">
                  Cook & Home Chef
                </Link>
              </li>
              <li>
                <Link href="/workers?category=electrician" className="hover:text-teal-400 transition-colors">
                  Electrician
                </Link>
              </li>
              <li>
                <Link href="/workers?category=plumber" className="hover:text-teal-400 transition-colors">
                  Plumber
                </Link>
              </li>
              <li>
                <Link href="/workers?category=carpenter" className="hover:text-teal-400 transition-colors">
                  Carpenter
                </Link>
              </li>
              <li>
                <Link href="/workers?category=general-labour" className="hover:text-teal-400 transition-colors">
                  General Labour
                </Link>
              </li>
              <li>
                <Link href="/workers?category=shifting-assistant" className="hover:text-teal-400 transition-colors">
                  Shifting Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* For Workers */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              For Workers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/worker/register" className="hover:text-teal-400 transition-colors">
                  Join as a Worker
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#workers" className="hover:text-teal-400 transition-colors">
                  Digital Work Passport
                </Link>
              </li>
              <li>
                <Link href="/worker/dashboard" className="hover:text-teal-400 transition-colors">
                  Worker Dashboard
                </Link>
              </li>
              <li>
                <Link href="/grievance" className="hover:text-teal-400 transition-colors">
                  Worker Grievance Redressal
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-teal-400 transition-colors">
                  Zero Platform Commission
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Trust & Policies
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/cancellation-policy" className="hover:text-teal-400 transition-colors">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/grievance" className="hover:text-teal-400 transition-colors">
                  Complaint & Grievance Desk
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-400 transition-colors">
                  Verification Methodology
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-400 transition-colors">
                  About KaamSetu
                </Link>
              </li>
              <li>
                <Link href="/blueprint" className="text-teal-300 hover:text-teal-200 font-semibold transition-colors flex items-center gap-1">
                  <span>Business Blueprint</span>
                  <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded border border-teal-500/30">PDF Plan</span>
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <span>Admin Console</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} KaamSetu Marketplace. Made for local workers and Indian households.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Prices in Indian Rupees (₹)
            </span>
            <span>•</span>
            <span className="text-slate-400">Direct Worker Payments Supported</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
