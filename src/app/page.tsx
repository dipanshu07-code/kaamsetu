'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { dictionary, formatINR } from '@/lib/utils';
import { WorkerProfile, Booking } from '@/types';
import WorkerCard from '@/components/WorkerCard';
import BookingModal from '@/components/BookingModal';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  UtensilsCrossed, 
  Zap, 
  Wrench, 
  Hammer, 
  HardHat, 
  Truck, 
  Baby, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Clock, 
  Banknote, 
  Star, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  UserCheck,
  FileCheck,
  Layers,
  HeartHandshake
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { workers, categories, language } = useAppStore();
  const dict = dictionary[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [localityQuery, setLocalityQuery] = useState('');
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<WorkerProfile | null>(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Booking | null>(null);

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (localityQuery) params.set('locality', localityQuery);
    router.push(`/workers?${params.toString()}`);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-indigo-600" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-6 h-6 text-amber-600" />;
      case 'Zap': return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-cyan-600" />;
      case 'Hammer': return <Hammer className="w-6 h-6 text-orange-600" />;
      case 'HardHat': return <HardHat className="w-6 h-6 text-emerald-600" />;
      case 'Truck': return <Truck className="w-6 h-6 text-teal-600" />;
      case 'Baby': return <Baby className="w-6 h-6 text-rose-400" />;
      default: return <Sparkles className="w-6 h-6 text-indigo-600" />;
    }
  };

  const faqs = [
    {
      q: 'How does KaamSetu differ from traditional brokerages or agencies?',
      a: 'KaamSetu is an open, transparent marketplace. There are no middleman commission deductions from the worker’s wages. Customers view transparent rate cards, direct contact details once booked, and pay workers directly via Cash or UPI upon satisfactory job completion.'
    },
    {
      q: 'What is the Digital Work Passport?',
      a: 'The Digital Work Passport is a portable career record for informal and skilled technicians. It logs completed jobs, customer ratings, verified skills, and background screening records. Self-reported experience is clearly distinguished from platform-verified checks to maintain 100% honesty.'
    },
    {
      q: 'How do payments work? Is payment required in advance?',
      a: 'No upfront payment is required for standard domestic or repair bookings. You agree on the scope and estimated price during request submission. Once the work is completed and verified by you in person, you settle directly with the worker via UPI QR code or cash.'
    },
    {
      q: 'Why are childcare services disabled?',
      a: 'Childcare requires specialized child safety certifications, mandatory biometric police verification, and stringent emergency safeguards. In accordance with KaamSetu safeguarding standards, this category remains locked until our comprehensive in-person verification infrastructure is deployed.'
    },
    {
      q: 'What happens if a worker cancels or does not arrive?',
      a: 'You can immediately access our Replacement Assistance tool on your dashboard. It scans your locality for other available verified workers in the same category so you can rebook with one click.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-900 to-slate-900 text-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-teal-300">
                <HeartHandshake className="w-4 h-4 text-teal-400" />
                <span>Empowering India’s Local Workforce</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
                Find Trusted Local Workers. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-400 to-amber-300">
                  Build Better Opportunities.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-lg max-w-xl leading-relaxed">
                {dict.heroSubtitle}
              </p>

              {/* Functional Search Bar */}
              <form onSubmit={handleHeroSearch} className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-white/20 text-slate-800 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50 sm:bg-transparent rounded-xl">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={dict.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="hidden sm:block w-px h-8 bg-slate-200" />

                <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50 sm:bg-transparent rounded-xl">
                  <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={dict.localityPlaceholder}
                    value={localityQuery}
                    onChange={(e) => setLocalityQuery(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span>{dict.searchBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Popular quick tags */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 pt-1">
                <span className="text-slate-400 font-medium">Quick find:</span>
                {['Electrician', 'Cook', 'Maid', 'Plumber', 'Carpenter'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      router.push(`/workers?q=${tag}`);
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* CTAs */}
              <div className="pt-2 flex items-center gap-4 flex-wrap">
                <Link
                  href="/worker/register"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <HardHat className="w-4 h-4 text-teal-400" />
                  <span>Join KaamSetu as a Worker</span>
                </Link>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Zero Platform Fee For Workers</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Main hero card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800/80 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                        <Award className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Digital Work Passport</h3>
                        <p className="text-[11px] text-teal-300">Verified Credentials & Portable Trust</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE PILOT
                    </span>
                  </div>

                  {/* Worker Preview Mock */}
                  <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80"
                      alt="Rameshwar Prasad"
                      className="w-14 h-14 rounded-2xl object-cover border border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate">Rameshwar Prasad</h4>
                        <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-slate-300">Electrician • 8 yrs exp</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          ★ 4.8
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300">41 Verified Jobs</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="block font-bold text-white text-base">₹0</span>
                      <span className="text-[10px] text-slate-400">Platform Cut</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="block font-bold text-teal-300 text-base">100%</span>
                      <span className="text-[10px] text-slate-400">Direct Pay</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="block font-bold text-amber-300 text-base">96%</span>
                      <span className="text-[10px] text-slate-400">On-Time</span>
                    </div>
                  </div>

                  {/* Transparent rates teaser */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                    <span>Electrician visit starts at ₹249</span>
                    <Link href="/workers" className="text-teal-300 hover:text-teal-200 font-semibold flex items-center gap-1">
                      <span>Explore workers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. SERVICE CATEGORIES
      ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Verified Domains
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {dict.categoriesHeading}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {dict.categoriesSubheading}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const isChildcare = cat.slug === 'childcare';

            if (!cat.isEnabled) {
              return (
                <div
                  key={cat.id}
                  className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 flex flex-col justify-between opacity-80"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                      {getCategoryIcon(cat.iconName)}
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base">
                        {language === 'hi' && cat.nameHi ? cat.nameHi : cat.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                        Paused
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {cat.disabledReason}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Safeguarding Review in Progress</span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={cat.id}
                href={`/workers?category=${cat.slug}`}
                className="group rounded-2xl border border-slate-200 hover:border-brand-700 bg-white p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center mb-4 transition-colors">
                    {getCategoryIcon(cat.iconName)}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-800 transition-colors">
                    {language === 'hi' && cat.nameHi ? cat.nameHi : cat.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                    {language === 'hi' && cat.descriptionHi ? cat.descriptionHi : cat.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {cat.popularServices.slice(0, 2).map((service, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">From</span>
                    <span className="text-xs font-bold text-brand-900">
                      {formatINR(cat.startingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      /{cat.priceUnit.replace('per-', '')}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. HOW IT WORKS (Customers vs Workers)
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-100/70 py-16 sm:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Clear & Transparent Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {dict.howItWorksHeading}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A fair two-sided marketplace designed to protect both households and service workers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* For Customers */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {dict.forCustomers}
                  </h3>
                  <p className="text-xs text-slate-500">How to discover & book local workers</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: '1. Select a service & locality', desc: 'Browse transparent rate cards and availability in your specific residential colony.' },
                  { title: '2. Compare profiles & passport credentials', desc: 'Inspect verified phone badges, police verification status, and real job photos.' },
                  { title: '3. Send a booking request', desc: 'Select preferred date, slot, and describe the requirements. No payment taken upfront.' },
                  { title: '4. Confirm scope & price with worker', desc: 'Worker reviews the task and accepts. Contact info is mutually unlocked.' },
                  { title: '5. Complete job & leave verified feedback', desc: 'Inspect work in person, pay directly via UPI/Cash, and post a job-linked review.' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{step.title}</h4>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <Link
                  href="/workers"
                  className="w-full py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Search Workers Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* For Workers */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {dict.forWorkers}
                  </h3>
                  <p className="text-xs text-slate-500">How to grow your independent earnings</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: '1. Create a simple mobile profile', desc: 'Sign up with your phone number, service skills, languages, and service radius.' },
                  { title: '2. Add rate card & availability schedule', desc: 'Set your own visiting fees, daily rates, or monthly charges. You control your prices.' },
                  { title: '3. Accept or decline incoming requests', desc: 'Get customer requests on your mobile dashboard. Review the location and job before accepting.' },
                  { title: '4. Direct customer payments (Zero Cut)', desc: 'Receive 100% of the agreed amount straight to your UPI account or in cash.' },
                  { title: '5. Build a portable Digital Work Passport', desc: 'Every completed job adds verified ratings and genuine proof-of-work to your profile.' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-800 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{step.title}</h4>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <Link
                  href="/worker/register"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Register as a Worker (Free)</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. TRUST & TRANSPARENCY SECTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900 rounded-3xl text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-900/50 px-3 py-1 rounded-full border border-teal-500/30">
              Honest Platform Principles
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {dict.trustHeading}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Many platforms make false promises of "100% background-certified" or "foolproof safety". At KaamSetu, we believe in honest transparency. We verify what we can verify, explicitly label self-reported details, and maintain an active grievance mediation desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3">
                <Banknote className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="font-bold text-white text-sm">Transparent Pricing</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Clear rate cards published by workers. No hidden surge fees or surprise commissions added to your bill.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5 text-teal-400" />
              </div>
              <h4 className="font-bold text-white text-sm">Job-Linked Reviews Only</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Reviews cannot be bought or submitted randomly. Only customers with completed booking numbers are eligible to rate workers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="font-bold text-white text-sm">Clear Verification Badges</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                We clearly separate platform-verified documents from self-reported worker experience so you make an informed hiring choice.
              </p>
            </div>
          </div>

          {/* Grievance Link */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">
              Have an issue with a booking? Our Operations Support Desk reviews every grievance ticket.
            </span>
            <Link
              href="/grievance"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/15 transition-colors"
            >
              Open Grievance Desk →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. FEATURED WORKERS CAROUSEL / GRID
      ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Active in Pilot Localities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Featured Local Professionals
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Experienced technicians and domestic helpers ready for booking in Delhi NCR, Bengaluru, Mumbai & Pune.
            </p>
          </div>

          <Link
            href="/workers"
            className="text-xs font-bold text-brand-800 hover:text-brand-900 flex items-center gap-1 group flex-shrink-0"
          >
            <span>View All Workers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.slice(0, 3).map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onRequestBooking={(w) => setSelectedWorkerForBooking(w)}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. BENEFITS FOR WORKERS
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-teal-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-800/80 px-3 py-1 rounded-full border border-teal-700">
                Worker Empowerment
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Why Local Technicians & Helpers Love KaamSetu
              </h2>
              <p className="text-sm text-teal-100 leading-relaxed">
                Traditional agencies lock workers into exploitative contracts, take 20-40% cuts, and withhold payments. KaamSetu gives you full digital ownership of your client relationships, schedule, and earnings.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">0% Platform Deductions:</strong> Keep 100% of what the customer pays you via UPI or cash.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Portable Digital Work Passport:</strong> Take your positive reviews, completed jobs count, and credentials wherever you move.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Full Freedom to Accept or Decline:</strong> You are an independent professional. Accept bookings that fit your schedule and location.
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/worker/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-teal-950 font-bold text-xs sm:text-sm hover:bg-teal-50 transition-colors shadow-lg"
                >
                  <HardHat className="w-4 h-4 text-teal-700" />
                  <span>Create Your Free Worker Profile</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-teal-850/90 rounded-3xl p-6 sm:p-8 border border-teal-700/60 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-300" />
                  <span>The Digital Work Passport in Action</span>
                </h3>
                <p className="text-xs text-teal-200 leading-relaxed">
                  In India, millions of skilled domestic and technical workers lack formal resumes or bankable proof of their years of loyal service. When they switch employers or relocate, their reputation resets to zero.
                </p>
                <div className="p-4 rounded-2xl bg-teal-900/80 border border-teal-700 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-teal-100">
                    <span>Verified Completed Jobs:</span>
                    <strong className="text-white">Logged automatically on booking sign-off</strong>
                  </div>
                  <div className="flex justify-between items-center text-teal-100">
                    <span>Verified Customer Ratings:</span>
                    <strong className="text-white">Tied directly to confirmed transactions</strong>
                  </div>
                  <div className="flex justify-between items-center text-teal-100">
                    <span>Proof of Work Photos:</span>
                    <strong className="text-white">Before & after photos of wiring/plumbing</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. DEMO TESTIMONIALS (Clearly Identified Sample Data)
      ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Sample Pilot Testimonials (Demo Dataset)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Feedback from Early Pilot Households
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback collected during our private pilot across South Delhi & Bengaluru.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Siddharth & Ananya Roy',
              locality: 'Lajpat Nagar IV, New Delhi',
              role: 'Household Customer',
              rating: 5,
              text: 'Booked Rameshwar for emergency MCB short circuit repair on a Sunday. He arrived in 40 minutes, diagnosed the loose neutral wire, and charged exactly the ₹299 visiting rate. Outstanding transparency.',
              service: 'Electrician Service'
            },
            {
              name: 'Dr. Vivek Kulkarni',
              locality: 'Kothrud, Pune',
              role: 'Apartment Owner',
              rating: 5,
              text: 'Gurpreet Singh helped repair our modular kitchen drawer slides and heavy teak wardrobe. Very respectful, wore boot covers inside the house, and finished in 2 hours.',
              service: 'Carpentry Repair'
            },
            {
              name: 'Kavita Menon',
              locality: 'HSR Layout, Bengaluru',
              role: 'Working Professional',
              rating: 5,
              text: 'Finding reliable shifting helpers in South Bengaluru used to mean haggling on the roadside. Through KaamSetu, Vikram arrived with bubble wrap and handled our electronics without a single scratch.',
              service: 'Shifting Assistant'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    (Verified Booking)
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{item.text}"
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[11px] text-slate-500">{item.locality}</p>
                </div>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {item.service}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. FREQUENTLY ASKED QUESTIONS (Accordion)
      ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-bold text-slate-900 text-sm">
                    {faq.q}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          9. BOTTOM CALL TO ACTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-5 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to hire a trusted local worker?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Search verified profiles in your locality, compare clear rate cards, and request bookings with zero hidden charges.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/workers"
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md"
            >
              Explore Available Workers
            </Link>
            <Link
              href="/worker/register"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-colors"
            >
              Join as a Service Worker
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {selectedWorkerForBooking && (
        <BookingModal
          worker={selectedWorkerForBooking}
          isOpen={Boolean(selectedWorkerForBooking)}
          onClose={() => setSelectedWorkerForBooking(null)}
          onSuccess={(newBooking) => {
            setSelectedWorkerForBooking(null);
            setBookingSuccessModal(newBooking);
          }}
        />
      )}

      {/* Booking Success Confirmation Dialog */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Booking Request Sent!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking Reference: <strong className="text-slate-800">#{bookingSuccessModal.bookingNumber}</strong>
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {bookingSuccessModal.workerName} has received your booking request for{' '}
              <strong>{bookingSuccessModal.scheduledDate}</strong> during the{' '}
              <strong>{bookingSuccessModal.scheduledTimeSlot}</strong> window. You will see updates directly on your dashboard.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <Link
                href="/customer/dashboard"
                onClick={() => setBookingSuccessModal(null)}
                className="px-5 py-2 rounded-xl bg-brand-800 text-xs font-semibold text-white hover:bg-brand-900 shadow-sm"
              >
                View Customer Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
