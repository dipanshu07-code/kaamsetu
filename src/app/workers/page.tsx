'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { WorkerProfile, Booking } from '@/types';
import WorkerCard from '@/components/WorkerCard';
import BookingModal from '@/components/BookingModal';
import PriceIntelligenceCard from '@/components/PriceIntelligenceCard';
import { 
  Search, 
  MapPin, 
  Filter, 
  ShieldCheck, 
  Star, 
  Clock, 
  Banknote, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

function WorkersSearchContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';
  const initialLocality = searchParams.get('locality') || '';

  const { workers, categories } = useAppStore();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocality, setSelectedLocality] = useState(initialLocality);
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [pricingBasisFilter, setPricingBasisFilter] = useState('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price_asc' | 'price_desc'>('rating');

  // Booking modal state
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<WorkerProfile | null>(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Booking | null>(null);

  // Available unique localities from data
  const localities = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => {
      if (w.locality) set.add(w.locality);
    });
    return Array.from(set);
  }, [workers]);

  // Filtered and sorted workers
  const filteredWorkers = useMemo(() => {
    return workers
      .filter((w) => {
        // Category filter
        if (selectedCategory !== 'all' && w.category !== selectedCategory) {
          return false;
        }

        // Query search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = w.fullName.toLowerCase().includes(q);
          const matchCategory = w.category.toLowerCase().includes(q);
          const matchSub = w.subcategories.some((sub) => sub.toLowerCase().includes(q));
          const matchLocality = w.locality.toLowerCase().includes(q);
          if (!matchName && !matchCategory && !matchSub && !matchLocality) {
            return false;
          }
        }

        // Locality filter
        if (selectedLocality && !w.locality.toLowerCase().includes(selectedLocality.toLowerCase())) {
          return false;
        }

        // Availability filter
        if (availableTodayOnly && !w.isAvailableToday) {
          return false;
        }

        // Verification filter
        if (verifiedOnly && w.verificationStatus !== 'verified') {
          return false;
        }

        // Pricing basis filter
        if (pricingBasisFilter !== 'all' && w.pricingBasis !== pricingBasisFilter) {
          return false;
        }

        // Min rating
        if (minRating > 0 && w.rating < minRating) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        if (sortBy === 'price_asc') return a.baseRate - b.baseRate;
        if (sortBy === 'price_desc') return b.baseRate - a.baseRate;
        return 0;
      });
  }, [
    workers,
    selectedCategory,
    searchQuery,
    selectedLocality,
    availableTodayOnly,
    verifiedOnly,
    pricingBasisFilter,
    minRating,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocality('');
    setAvailableTodayOnly(false);
    setVerifiedOnly(false);
    setPricingBasisFilter('all');
    setMinRating(0);
    setSortBy('rating');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Worker Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Find Trusted Local Service Workers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse transparent profiles, verified digital passports, and direct rate cards across your city.
          </p>
        </div>

        {/* Search Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by worker name, skill, or service (e.g. Inverter, Tile leak, Cook)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-800"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <MapPin className="w-4 h-4 text-teal-600 absolute left-3.5 top-3.5" />
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-800 bg-white"
            >
              <option value="">All Localities / Colonies</option>
              {localities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-800 bg-white font-medium"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories
            .filter((c) => c.isEnabled)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Worker Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 space-y-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Filter className="w-4 h-4 text-brand-800" />
              <span>Filters</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-brand-700 hover:text-brand-900 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Available Today
              </span>
              <input
                type="checkbox"
                checked={availableTodayOnly}
                onChange={(e) => setAvailableTodayOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-800 focus:ring-brand-800"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Workers Only
              </span>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-800 focus:ring-brand-800"
              />
            </label>
          </div>

          {/* Pricing Basis */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pricing Model
            </label>
            <select
              value={pricingBasisFilter}
              onChange={(e) => setPricingBasisFilter(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">Any Pricing Basis</option>
              <option value="per-visit">Per Visit / Inspection</option>
              <option value="per-hour">Hourly Job</option>
              <option value="per-day">Full Day Shift</option>
              <option value="per-month">Monthly Domestic Service</option>
              <option value="quoted">Quoted / Project Basis</option>
            </select>
          </div>

          {/* Minimum Rating */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Minimum Rating
            </label>
            <div className="space-y-1.5">
              {[0, 4.5, 4.8].map((ratingVal) => (
                <button
                  key={ratingVal}
                  type="button"
                  onClick={() => setMinRating(ratingVal)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    minRating === ratingVal
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {ratingVal === 0 ? 'All Ratings' : `${ratingVal} Stars & Above`}
                  </span>
                  {ratingVal > 0 && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Local Price Intelligence Widget */}
          {selectedCategory !== 'all' && (
            <div className="pt-2 border-t border-slate-100">
              <PriceIntelligenceCard
                categorySlug={selectedCategory}
                locality={selectedLocality}
              />
            </div>
          )}
        </aside>

        {/* Workers List Column */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{filteredWorkers.length}</strong> matching local service workers
            </span>
            <span className="text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-medium">
              Demo Environment Data
            </span>
          </div>

          {filteredWorkers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">
                No workers match your exact filter criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your locality search, resetting the rating filter, or browsing all service categories.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-800 text-white text-xs font-semibold hover:bg-brand-900"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onRequestBooking={(w) => setSelectedWorkerForBooking(w)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

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

      {/* Booking Confirmation Dialog */}
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
              <strong>{bookingSuccessModal.scheduledDate}</strong>. Monitor progress on your dashboard.
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
                Go to Customer Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading worker directory...</div>}>
      <WorkersSearchContent />
    </Suspense>
  );
}
