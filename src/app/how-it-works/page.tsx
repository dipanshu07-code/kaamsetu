'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Award, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  HeartHandshake, 
  ArrowRight,
  HardHat,
  RotateCcw
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          The KaamSetu Protocol
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Transparent, Direct, and Accountable.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          KaamSetu is India’s non-exploitative local services platform. We connect residential customers directly with skilled workers with zero commission deductions and a portable Digital Work Passport.
        </p>
      </div>

      {/* Side-by-side Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Customer Journey */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">For Households & Customers</h2>
              <p className="text-xs text-slate-500">Hire trusted technicians and domestic help</p>
            </div>
          </div>

          <div className="space-y-6 text-xs">
            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <strong className="text-slate-900 text-sm block">Discover by Locality & Trade</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Search electricians, cooks, maids, plumbers, and carpenters active in your exact colony or apartment complex.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <strong className="text-slate-900 text-sm block">Inspect Real Passports & Rate Cards</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  View published visiting fees, verified telephone badges, colony references, and before/after job photographs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <strong className="text-slate-900 text-sm block">Send a Request With Zero Advance</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Choose your preferred date and slot. We do not ask for card details or advance payments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0">4</span>
              <div>
                <strong className="text-slate-900 text-sm block">Inspect & Pay Directly to the Worker</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Once the worker completes the job satisfactorily, pay them directly via UPI QR code or cash. 100% of your money goes to the worker.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/workers"
              className="w-full py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore Worker Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Worker Journey */}
        <div id="workers" className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">For Service Workers</h2>
              <p className="text-xs text-slate-500">Take charge of your career & earnings</p>
            </div>
          </div>

          <div className="space-y-6 text-xs">
            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <strong className="text-slate-900 text-sm block">Sign Up In 2 Minutes (Privacy First)</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  No confidential Aadhaar upload required. Just your name, phone number, skills, operating radius, and rate card.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <strong className="text-slate-900 text-sm block">Control Your Pricing & Working Hours</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  You decide your visiting fees and operating slots. Toggle "Available Today" whenever you want new bookings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <strong className="text-slate-900 text-sm block">100% Direct Cash/UPI Earnings</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  No platform cut. No delayed payouts. Customers pay you directly upon completing the task.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0">4</span>
              <div>
                <strong className="text-slate-900 text-sm block">Build Your Digital Work Passport</strong>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Every completed booking automatically builds your verifiable portfolio of 5-star ratings, trade proof, and client feedback.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/worker/register"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <HardHat className="w-4 h-4" />
              <span>Register as a Worker</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Differentiating Pillars */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold">The 4 Pillars of KaamSetu</h2>
          <p className="text-xs text-slate-400">Engineering accountability into local Indian marketplaces</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
            <Award className="w-6 h-6 text-teal-400" />
            <strong className="text-white text-sm block">Digital Work Passport</strong>
            <p className="text-slate-400 leading-relaxed">
              Provides informal workers with an authentic, non-forgeable record of their work history and customer endorsements.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
            <Banknote className="w-6 h-6 text-emerald-400" />
            <strong className="text-white text-sm block">Local Price Intelligence</strong>
            <p className="text-slate-400 leading-relaxed">
              Transparent market rate benchmarks eliminate arbitrary roadside price haggling and surprise bill surges.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
            <RotateCcw className="w-6 h-6 text-amber-400" />
            <strong className="text-white text-sm block">Replacement Assistance</strong>
            <p className="text-slate-400 leading-relaxed">
              If an emergency prevents a worker from arriving, our platform immediately suggests alternative vetted workers nearby.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <strong className="text-white text-sm block">Two-Way Accountability</strong>
            <p className="text-slate-400 leading-relaxed">
              Strict policy enforcement, job-linked reviews, and a 24-hour grievance desk for dispute mediation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
