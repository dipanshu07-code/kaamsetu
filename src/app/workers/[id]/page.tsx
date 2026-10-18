'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatINR, formatIndianPhone, dictionary } from '@/lib/utils';
import { Booking, WorkerProfile } from '@/types';
import BookingModal from '@/components/BookingModal';
import PriceIntelligenceCard from '@/components/PriceIntelligenceCard';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Phone, 
  Languages, 
  Banknote, 
  FileText, 
  ArrowLeft, 
  ExternalLink,
  Camera,
  HeartHandshake,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function WorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;

  const { workers, reviews, language } = useAppStore();
  const dict = dictionary[language];

  const worker = workers.find((w) => w.id === workerId);
  const workerReviews = reviews.filter((r) => r.workerId === workerId);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<Booking | null>(null);

  if (!worker) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Worker Profile Not Found</h2>
        <p className="text-xs text-slate-500">The profile you requested does not exist or has been removed.</p>
        <Link
          href="/workers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Worker Directory</span>
        </Link>
      </div>
    );
  }

  const isVerified = worker.verificationStatus === 'verified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/workers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Worker Directory</span>
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-slate-200 shadow-sm">
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                className="w-full h-full object-cover"
              />
              {worker.isAvailableToday && (
                <span className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {language === 'hi' && worker.fullNameHi ? worker.fullNameHi : worker.fullName}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Worker</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Self-Reported Profile</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="capitalize font-semibold text-slate-700">
                  {worker.category.replace('-', ' ')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {worker.locality}, {worker.city} ({worker.serviceRadiusKm} km radius)
                </span>
                <span>•</span>
                <span>{worker.experienceYears} Years Active Experience</span>
              </div>

              <div className="flex items-center gap-4 pt-1 text-xs">
                <div className="flex items-center gap-1 font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{worker.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({workerReviews.length} Verified Reviews)</span>
                </div>

                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Award className="w-3.5 h-3.5" />
                  <span>{worker.completedJobsCount} Jobs Completed</span>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-slate-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{worker.onTimeArrivalRatePercent}% Punctuality Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Booking CTA Card on Right */}
          <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-shrink-0 space-y-3">
            <div className="flex md:flex-col items-center md:items-start justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Starting Visiting Rate:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-brand-900">
                  {formatINR(worker.baseRate)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  /{worker.pricingBasis.replace('per-', '')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full py-3 px-6 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{dict.requestBooking}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Passport Details & Rate Cards, Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* ══════════════════════════════════════════════════════════
              DIGITAL WORK PASSPORT (Core Differentiating Feature)
          ════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-600/30 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Digital Work Passport
                  </h2>
                  <p className="text-xs text-slate-500">
                    Portable career record of verified skills, jobs, and transparency checks.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Official Credential
              </span>
            </div>

            {/* Verification Credential Status Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Platform Verification Checks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Phone & Identity */}
                <div className={`p-3.5 rounded-2xl border ${
                  worker.verificationDetails.isIdentityVerified
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong className="font-semibold">Phone OTP Verified</strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Mobile connection verified via one-time SMS passkey.
                  </p>
                </div>

                {/* 2. Address & References */}
                <div className={`p-3.5 rounded-2xl border ${
                  worker.verificationDetails.isBackgroundChecked
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                    : 'border-amber-200 bg-amber-50/60 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {worker.verificationDetails.isBackgroundChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                    )}
                    <strong className="font-semibold">Address Screening</strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {worker.verificationDetails.isBackgroundChecked
                      ? 'Local colony residential address verified by ops team.'
                      : 'Self-reported locality. In-person field visit pending.'}
                  </p>
                </div>

                {/* 3. Skill & Trade Endorsement */}
                <div className={`p-3.5 rounded-2xl border ${
                  worker.verificationDetails.isSkillEndorsed
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong className="font-semibold">Skill & Tools Endorsed</strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Practical tool possession and past client references validated.
                  </p>
                </div>
              </div>
            </div>

            {/* Proof of Work Showcase (Before and After Photos) */}
            {worker.proofOfWorkExamples && worker.proofOfWorkExamples.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Customer-Approved Proof of Work (Before & After)
                  </h3>
                </div>

                {worker.proofOfWorkExamples.map((pow) => (
                  <div key={pow.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="font-bold text-slate-900">{pow.title}</strong>
                      <span className="text-[11px] text-slate-500">Completed on {pow.completedDate}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pow.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {pow.beforePhoto && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Before Repair
                          </span>
                          <img
                            src={pow.beforePhoto}
                            alt="Before"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                      {pow.afterPhoto && (
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                            After Completion
                          </span>
                          <img
                            src={pow.afterPhoto}
                            alt="After"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rate Cards & Services */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-brand-800" />
              <span>Published Rate Card & Service Scope</span>
            </h2>
            <p className="text-xs text-slate-500">
              Clear rates set directly by {worker.fullName}. No hidden platform commission or brokerage charges.
            </p>

            <div className="space-y-3 pt-2">
              {worker.rateCards.map((rc) => (
                <div
                  key={rc.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-brand-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">{rc.serviceTitle}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{rc.description}</p>
                    <span className="inline-block text-[10px] uppercase font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {rc.pricingBasis}
                    </span>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                    <span className="text-base font-bold text-brand-900">
                      {formatINR(rc.amount)}
                    </span>
                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-800 text-white text-xs font-semibold hover:bg-brand-900 transition-colors"
                    >
                      Book This
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews & Feedback */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Verified Job-Linked Reviews ({workerReviews.length})
                </h2>
                <p className="text-xs text-slate-500">
                  All reviews are tied to confirmed completed bookings on KaamSetu.
                </p>
              </div>

              <div className="flex items-center gap-1 text-base font-bold text-slate-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{worker.rating.toFixed(1)}</span>
              </div>
            </div>

            {workerReviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No reviews recorded yet for this worker. Be the first to book and rate!
              </div>
            ) : (
              <div className="space-y-4">
                {workerReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                        <span className="text-[11px] text-slate-400">• {rev.customerLocality}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        Verified Booking #{rev.bookingId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>Punctuality: <strong>{rev.punctualityRating}/5</strong></span>
                      <span>Quality: <strong>{rev.workQualityRating}/5</strong></span>
                      <span>Politeness: <strong>{rev.politenessRating}/5</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Availability & Guidelines */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Availability Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Weekly Availability Schedule
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Working Days:</span>
                <span className="font-bold text-slate-900">
                  {worker.availabilitySchedule.days.join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Operating Slots:</span>
                <span className="font-bold text-slate-900 text-right">
                  {worker.availabilitySchedule.timeSlots.join(' & ')}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Languages Spoken:</span>
                <span className="font-bold text-slate-900">
                  {worker.languages.join(', ')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs shadow-md transition-colors"
            >
              Request Booking With {worker.fullName.split(' ')[0]}
            </button>
          </div>

          {/* Local Price Benchmark */}
          <PriceIntelligenceCard
            categorySlug={worker.category}
            locality={worker.locality}
          />

          {/* Trust and Safety Notice */}
          <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200/80 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Customer Safety Advice</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800">
              Verify the worker’s name and photograph upon arrival. Inspect completed work before releasing UPI/Cash payment. Keep receipts of any replacement spare parts purchased.
            </p>
          </div>
        </aside>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          worker={worker}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={(newBooking) => {
            setIsBookingModalOpen(false);
            setBookingSuccessModal(newBooking);
          }}
        />
      )}

      {/* Booking Success Dialog */}
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
              {bookingSuccessModal.workerName} has been notified for your request on{' '}
              <strong>{bookingSuccessModal.scheduledDate}</strong>.
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
