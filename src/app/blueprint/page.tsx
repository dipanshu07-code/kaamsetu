'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';
import {   
  TrendingUp,   
  ArrowRight,   
  Users, 
  AlertTriangle, 
  HeartHandshake,    
  Sliders, 
  Briefcase,
  RefreshCw,
} from 'lucide-react';

export default function BlueprintPage() {
  // Unit Economics Interactive Calculator State (Page 6 of Blueprint)
  const [completedBookings, setCompletedBookings] = useState<number>(2000);
  const [avgBookingValue, setAvgBookingValue] = useState<number>(800);
  const [commissionRate, setCommissionRate] = useState<number>(10); // percentage
  const [otherMonthlyRevenue, setOtherMonthlyRevenue] = useState<number>(20000);
  const [variableCostPerBooking, setVariableCostPerBooking] = useState<number>(20);
  const [fixedOperatingExpenses, setFixedOperatingExpenses] = useState<number>(150000);

  // Computed Unit Economics
  const gmv = completedBookings * avgBookingValue;
  const commissionRevenue = gmv * (commissionRate / 100);
  const totalRevenue = commissionRevenue + otherMonthlyRevenue;
  const totalVariableExpenses = completedBookings * variableCostPerBooking;
  const operatingResult = totalRevenue - totalVariableExpenses - fixedOperatingExpenses;
  const contributionPerBooking = (avgBookingValue * (commissionRate / 100)) - variableCostPerBooking;
  const breakEvenBookings = contributionPerBooking > 0 
    ? Math.ceil((fixedOperatingExpenses - otherMonthlyRevenue) / contributionPerBooking) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      <p lang="en" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Internal business-planning document, available in English only. Figures are planning assumptions and model inputs, not
        measured results. The commission scenarios below are hypotheses; the live product currently charges no commission.
        / यह आंतरिक योजना दस्तावेज़ सिर्फ़ अंग्रेज़ी में है।
      </p>
      {/* ══════════════════════════════════════════════════════════════
          PAGE TITLE & EXECUTIVE BANNER (Page 1)
      ════════════════════════════════════════════════════════════════ */}
      <div className="bg-stone-900 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-900/60 border border-teal-500/40 px-3.5 py-1 rounded-full">
            Official Planning Blueprint
          </span>
          <span className="text-xs text-slate-400">
            Validated for Local Pilot Expansion
          </span>
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            KaamSetu Website & Business Blueprint
          </h1>
          <p className="text-teal-300 font-semibold text-base sm:text-lg">
            “Connecting Local Workers with Trusted Opportunities.”
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A practical architectural and business plan for building a local services marketplace that helps households and businesses discover, compare, contact, and book workers such as maids, cooks, electricians, plumbers, carpenters, and general labourers.
          </p>
        </div>

        {/* Blueprint Quick Parameter Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Core Idea</span>
            <strong className="text-white text-xs mt-0.5 block">Discover, compare & book local workers</strong>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Users</span>
            <strong className="text-white text-xs mt-0.5 block">Customers, workers & administrators</strong>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Market Approach</span>
            <strong className="text-teal-300 text-xs mt-0.5 block">1 locality pilot, learn, then scale</strong>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Core Impact</span>
            <strong className="text-amber-300 text-xs mt-0.5 block">Worker dignity & easier local hiring</strong>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 & 2: EXECUTIVE SUMMARY & PROBLEM STATEMENT (Page 2)
      ════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="border-l-4 border-teal-600 pl-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            1. Executive Summary & Problem Statement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Understanding the two-sided market friction in Indian urban clusters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Customer Challenges</h3>
            <p className="text-slate-600 leading-relaxed">
              Finding reliable local help depends on word of mouth, scattered unverified listings, unpredictable arrival times, and arbitrary roadside price haggling without accountability.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5 text-teal-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Worker Challenges</h3>
            <p className="text-slate-600 leading-relaxed">
              Skilled workers lack portable proof of their work history, face exploitative 25-40% cuts from aggregator agencies, and lose their reputation whenever they switch colonies.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">The KaamSetu Solution</h3>
            <p className="text-slate-600 leading-relaxed">
              A transparent, two-sided marketplace with clear rate cards, direct UPI settlement, verified work passports, and a strict separation of self-reported vs verified badges.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: TARGET AUDIENCE & SERVICE CATEGORIES (Page 2)
      ════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="border-l-4 border-teal-600 pl-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            2. Service Categories & Booking Formats
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured delivery models tailored to domestic help, skilled technicians, and general labour
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-900 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-4">Category</th>
                  <th className="p-4">Examples</th>
                  <th className="p-4">Booking Formats</th>
                  <th className="p-4">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Domestic Help</td>
                  <td className="p-4">Maid, housekeeper, cook</td>
                  <td className="p-4 font-medium text-brand-900">Per visit, hourly, daily or monthly</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active Pilot
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Skilled Technicians</td>
                  <td className="p-4">Electrician, plumber, carpenter</td>
                  <td className="p-4 font-medium text-brand-900">Visiting inspection fee, hourly or quoted job</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active Pilot
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">General Labour</td>
                  <td className="p-4">Construction helper, loader, shifting assistant</td>
                  <td className="p-4 font-medium text-brand-900">Hourly, half-day or full-day shift</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active Pilot
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-rose-50/30">
                  <td className="p-4 font-bold text-slate-900">Childcare (Later Phase)</td>
                  <td className="p-4">Babysitter, nanny</td>
                  <td className="p-4 font-medium text-slate-600">Hourly, half-day, full-day or monthly</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Safeguarding Paused
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Safeguarding Rule:</strong> Childcare is introduced only after mandatory biometric police verification, child safety certification, and emergency protocol screening are operational.
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 & 5: THE 8 DIFFERENTIATING FEATURES (Page 3)
      ════════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="border-l-4 border-teal-600 pl-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            3. Features That Differentiate KaamSetu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Eight architectural innovations engineered into the platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {[
            {
              title: 'Digital Work Passport',
              badge: 'Worker Dignity',
              what: 'Shows experience, verified skills, completed jobs, and job-linked reviews.',
              why: 'Lets workers build a portable reputation that stays with them.',
              link: '/workers/w-1',
              linkText: 'Inspect Demo Passport'
            },
            {
              title: 'Local Price Intelligence',
              badge: 'Fair Pricing',
              what: 'Shows typical price ranges or comparable quotes where sufficient data exists.',
              why: 'Reduces uncertainty; eliminates arbitrary price exploitation.',
              link: '/workers',
              linkText: 'View Benchmark Rates'
            },
            {
              title: 'Flexible Booking',
              badge: 'Versatile',
              what: 'Supports per-visit, hourly, daily, monthly, and quoted jobs.',
              why: 'Matches varying trade categories accurately.',
              link: '/workers',
              linkText: 'Explore Categories'
            },
            {
              title: 'Proof of Work',
              badge: 'Accountability',
              what: 'Optional before/after photos and customer-approved completion notes.',
              why: 'Clarifies work performed and prevents dispute ambiguity.',
              link: '/workers/w-1',
              linkText: 'See MCB Photo Proof'
            },
            {
              title: 'Repeat Booking',
              badge: 'Retention',
              what: 'One-click rebook workflow for previously hired technicians or helpers.',
              why: 'Improves customer retention and steady worker income.',
              link: '/customer/dashboard',
              linkText: 'Test Rehire Flow'
            },
            {
              title: 'Replacement Assistance',
              badge: 'Reliability',
              what: 'Finds verified alternative workers nearby when a booking cancels.',
              why: 'Improves reliability without making false instant promises.',
              link: '/customer/dashboard',
              linkText: 'See Replacement Flow'
            },
            {
              title: 'Two-Way Reviews',
              badge: 'Fairness',
              what: 'Collects feedback after completed work from both parties.',
              why: 'Encourages mutual respect and fairer dispute resolution.',
              link: '/customer/dashboard',
              linkText: 'Review Guidelines'
            },
            {
              title: 'Assisted Onboarding',
              badge: 'Inclusion',
              what: 'Simple language, dual English/Hindi labels, and telephone OTP.',
              why: 'Ensures smartphone literacy is not a barrier to participation.',
              link: '/worker/register',
              linkText: 'View Onboarding'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  {item.badge}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed text-[11px]">{item.what}</p>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px]">
                  <strong>Why it matters:</strong> {item.why}
                </div>
              </div>
              <Link
                href={item.link}
                className="text-[11px] font-bold text-brand-800 hover:text-brand-900 flex items-center gap-1 pt-1"
              >
                <span>{item.linkText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6: INTERACTIVE UNIT ECONOMICS CALCULATOR (Page 6)
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Page 6 Model: Interactive Financial Simulation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Illustrative Unit Economics & Profitability
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Adjust monthly booking volume, commission rate, and expenses to observe break-even dynamics.
            </p>
          </div>

          <button
            onClick={() => {
              setCompletedBookings(2000);
              setAvgBookingValue(800);
              setCommissionRate(10);
              setOtherMonthlyRevenue(20000);
              setVariableCostPerBooking(20);
              setFixedOperatingExpenses(150000);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Blueprint Baseline</span>
          </button>
        </div>

        {/* Inputs vs Outputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-5 text-xs bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Simulation Controls</span>
            </h3>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 font-medium">Monthly Completed Bookings:</span>
                <strong className="text-white text-sm">{completedBookings.toLocaleString('en-IN')}</strong>
              </div>
              <input
                type="range"
                min={200}
                max={10000}
                step={100}
                value={completedBookings}
                onChange={(e) => setCompletedBookings(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 font-medium">Average Booking Value (₹):</span>
                <strong className="text-white text-sm">{formatINR(avgBookingValue)}</strong>
              </div>
              <input
                type="range"
                min={300}
                max={2500}
                step={50}
                value={avgBookingValue}
                onChange={(e) => setAvgBookingValue(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 font-medium">Platform Commission Rate (%):</span>
                <strong className="text-teal-300 text-sm">{commissionRate}%</strong>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                KaamSetu baseline hypothesis: 8%–12% commission
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Fixed Monthly Costs (₹)</label>
                <input
                  type="number"
                  value={fixedOperatingExpenses}
                  onChange={(e) => setFixedOperatingExpenses(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Other Revenue (Ads/B2B)</label>
                <input
                  type="number"
                  value={otherMonthlyRevenue}
                  onChange={(e) => setOtherMonthlyRevenue(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Real-Time Results Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Merchandise Value (GMV)</span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{formatINR(gmv)}</span>
                <span className="text-[10px] text-slate-400">Total services value booked</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Commission Revenue</span>
                <span className="text-xl sm:text-2xl font-black text-teal-300 mt-1 block">{formatINR(commissionRevenue)}</span>
                <span className="text-[10px] text-slate-400">At {commissionRate}% commission</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Platform Revenue</span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{formatINR(totalRevenue)}</span>
                <span className="text-[10px] text-slate-400">Commission + other streams</span>
              </div>

              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Expenses</span>
                <span className="text-xl sm:text-2xl font-black text-slate-300 mt-1 block">
                  {formatINR(totalVariableExpenses + fixedOperatingExpenses)}
                </span>
                <span className="text-[10px] text-slate-400">Variable + fixed operational</span>
              </div>
            </div>

            {/* Operating Result Callout */}
            <div className={`p-5 rounded-2xl border ${
              operatingResult >= 0 
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' 
                : 'bg-rose-950/70 border-rose-500 text-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block">
                    Illustrative Operating Result
                  </span>
                  <span className="text-2xl sm:text-3xl font-black mt-1 block">
                    {operatingResult >= 0 ? `+${formatINR(operatingResult)}` : `-${formatINR(Math.abs(operatingResult))}`}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  operatingResult >= 0 ? 'bg-emerald-500 text-slate-900' : 'bg-rose-500 text-white'
                }`}>
                  {operatingResult >= 0 ? 'Profitable' : 'Operating Deficit'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs flex justify-between flex-wrap gap-2">
                <span>Contribution / booking: <strong>{formatINR(contributionPerBooking)}</strong></span>
                <span>Break-even volume: <strong>{breakEvenBookings.toLocaleString('en-IN')} bookings/mo</strong></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              * Note: GMV is the total value of services performed by workers; it is not platform revenue. The business earns commissions and fees. Actual accounting treatment depends on commercial tax and state regulations.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7: INDICATIVE MVP BUDGET & ROADMAP (Pages 6-8)
      ════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MVP Budget Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="border-l-4 border-brand-800 pl-3">
            <h3 className="font-extrabold text-slate-900 text-base">
              Indicative MVP Build Budget (₹2,50,000)
            </h3>
            <p className="text-xs text-slate-500">From Page 6 of the Business Blueprint</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Workstream</th>
                  <th className="p-3 text-right">Illustrative Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-medium">UI/UX Design & Brand Aesthetics</td>
                  <td className="p-3 font-bold text-right text-slate-900">₹35,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Backend, Authentication & Supabase Schema</td>
                  <td className="p-3 font-bold text-right text-slate-900">₹55,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Worker Profiles, Rate Cards & Faceted Search</td>
                  <td className="p-3 font-bold text-right text-slate-900">₹40,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Bookings Workflow, Reviews & Admin Panel</td>
                  <td className="p-3 font-bold text-right text-slate-900">₹45,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Integrations & Automated Test Suite</td>
                  <td className="p-3 font-bold text-right text-slate-900">₹30,000</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Contingency Buffer</td>
                  <td className="p-3 font-bold text-right text-slate-900">₹15,000</td>
                </tr>
                <tr className="bg-brand-50/70 font-black text-brand-950">
                  <td className="p-3">Total One-Time Build Budget</td>
                  <td className="p-3 text-right text-sm">₹2,50,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            * Excludes ongoing hosting, maps API, payment gateway, and legal/marketing costs.
          </p>
        </div>

        {/* 5-Phase Development Roadmap */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="border-l-4 border-teal-600 pl-3">
            <h3 className="font-extrabold text-slate-900 text-base">
              Development & Launch Roadmap
            </h3>
            <p className="text-xs text-slate-500">Phases 1 to 5 with clear exit criteria</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900">Phase 1: Discovery</strong>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">Done</span>
              </div>
              <p className="text-slate-500 mt-1">Interviews with workers and customers; priority use cases established.</p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex justify-between items-center">
                <strong className="text-emerald-950 font-bold">Phase 2: MVP Build (Current State)</strong>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">Completed</span>
              </div>
              <p className="text-emerald-800 mt-1">Next.js application, dual-mode store, 15 Supabase tables, tests passing.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900">Phase 3: Pilot Deployment</strong>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">Next</span>
              </div>
              <p className="text-slate-500 mt-1">Single colony launch (Lajpat Nagar / Koramangala); measure completed jobs.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900">Phase 4: Operational Improvement</strong>
                <span className="text-[10px] text-slate-500">Upcoming</span>
              </div>
              <p className="text-slate-500 mt-1">Refine cancellation, replacement, and customer support flows.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900">Phase 5: Multi-Locality Expansion</strong>
                <span className="text-[10px] text-slate-500">Upcoming</span>
              </div>
              <p className="text-slate-500 mt-1">Expand into new cities and unlock childcare once safeguards are certified.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 8: SDGs & SOCIAL IMPACT (Page 9)
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-stone-900 rounded-2xl p-8 sm:p-12 text-white space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
            Social Development Goals
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Aligned with UN Sustainable Development Goals (SDGs)
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            From Page 9 of the Blueprint: Technology designed to formalize reputation and advance economic mobility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-2">
          <div className="bg-white/10 border border-white/10 p-5 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">SDG 8</span>
            <h3 className="font-bold text-white text-sm">Decent Work & Economic Growth</h3>
            <p className="text-teal-100 leading-relaxed">
              Helps informal workers showcase skills, connect directly with customers, and build a lasting portable record of completed work.
            </p>
          </div>

          <div className="bg-white/10 border border-white/10 p-5 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">SDG 10</span>
            <h3 className="font-bold text-white text-sm">Reduced Inequalities</h3>
            <p className="text-teal-100 leading-relaxed">
              Makes job discovery and platform onboarding accessible to technicians and helpers with fewer digital resources.
            </p>
          </div>

          <div className="bg-white/10 border border-white/10 p-5 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">SDG 9</span>
            <h3 className="font-bold text-white text-sm">Industry & Infrastructure</h3>
            <p className="text-teal-100 leading-relaxed">
              Uses open digital tools to organize fragmented local service discovery and direct booking workflows.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <span className="text-teal-200">
            <strong>Launch Success Principle:</strong> Build trust and reliable operations first; scale only when the service works well for both customers and workers.
          </span>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold transition-colors flex-shrink-0"
          >
            Launch KaamSetu Marketplace →
          </Link>
        </div>
      </section>
    </div>
  );
}
