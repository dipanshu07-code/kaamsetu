'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WorkerProfile } from '@/types';
import { formatINR, dictionary } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  ArrowRight,
  ShieldAlert,
  Award
} from 'lucide-react';

interface WorkerCardProps {
  worker: WorkerProfile;
  onRequestBooking?: (worker: WorkerProfile) => void;
}

export default function WorkerCard({ worker, onRequestBooking }: WorkerCardProps) {
  const { language } = useAppStore();
  const dict = dictionary[language];

  const isVerified = worker.verificationStatus === 'verified';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Card Header & Avatar */}
        <div className="p-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {worker.isAvailableToday ? (
                <span 
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" 
                  title="Available Today"
                />
              ) : (
                <span 
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-slate-400 border-2 border-white rounded-full" 
                  title="Book in advance"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                  {language === 'hi' && worker.fullNameHi ? worker.fullNameHi : worker.fullName}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{worker.locality}, {worker.city}</span>
              </div>

              {/* Rating & Experience */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1 font-semibold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{worker.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({worker.reviewCount})</span>
                </div>

                <span className="text-slate-500">
                  {worker.experienceYears} yrs exp
                </span>

                <span className="text-slate-300">•</span>

                <span className="text-slate-600 font-medium">
                  {worker.completedJobsCount} jobs
                </span>
              </div>
            </div>
          </div>

          {/* Verification Badge (Transparent distinction between verified vs self-reported) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full font-medium text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Worker</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-medium text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Self-Reported Experience</span>
              </span>
            )}

            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
              worker.isAvailableToday ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
            }`}>
              {worker.isAvailableToday ? '⚡ Available Today' : '📅 Advance Booking'}
            </span>
          </div>

          {/* Short Bio Snippet */}
          <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {language === 'hi' && worker.bioHi ? worker.bioHi : worker.bio}
          </p>

          {/* Specialization tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {worker.subcategories.slice(0, 3).map((sub, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-normal"
              >
                {sub}
              </span>
            ))}
            {worker.subcategories.length > 3 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{worker.subcategories.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="px-5 py-3 bg-slate-50 border-t border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Starting Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-brand-900">
                {formatINR(worker.baseRate)}
              </span>
              <span className="text-xs text-slate-500">
                /{worker.pricingBasis.replace('per-', '')}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Arrival Punctuality</span>
            <span className="text-xs font-semibold text-emerald-700">
              {worker.onTimeArrivalRatePercent}% On-Time
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-4 bg-white grid grid-cols-2 gap-2">
        <Link
          href={`/workers/${worker.id}`}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1"
        >
          <Award className="w-3.5 h-3.5 text-teal-600" />
          <span>Digital Passport</span>
        </Link>

        <button
          onClick={() => onRequestBooking ? onRequestBooking(worker) : null}
          className="w-full py-2.5 px-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1"
        >
          <span>{dict.requestBooking}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
