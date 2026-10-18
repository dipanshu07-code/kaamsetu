'use client';

import React from 'react';
import { Booking, WorkerProfile } from '@/types';
import { useAppStore } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { X, RefreshCw, AlertCircle, ArrowRight, Star, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ReplacementAssistanceModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSelectAlternative: (worker: WorkerProfile) => void;
}

export default function ReplacementAssistanceModal({
  booking,
  isOpen,
  onClose,
  onSelectAlternative,
}: ReplacementAssistanceModalProps) {
  const { workers } = useAppStore();

  if (!isOpen) return null;

  // Find other available workers in same category or nearby
  const alternatives = workers.filter(
    (w) => w.id !== booking.workerId && w.category === booking.serviceCategory
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Replacement Assistance Desk
              </h3>
              <p className="text-xs text-slate-500">
                Finding vetted options for {booking.serviceTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 mb-4">
            <p>
              When a booking is cancelled, KaamSetu displays nearby alternative professionals who provide similar services in your locality. We do not automatically dispatch workers without your express consent.
            </p>
          </div>

          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Suggested Alternative Workers ({alternatives.length} Available)
          </h4>

          {alternatives.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                No alternative workers currently available in this specific category.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Please check the general worker directory or file a support request.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={alt.avatarUrl}
                      alt={alt.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        {alt.fullName}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {alt.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {alt.locality}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-brand-900 mt-0.5 block">
                        {formatINR(alt.baseRate)} ({alt.pricingBasis})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectAlternative(alt)}
                    className="px-3.5 py-2 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    <span>Request Rebook</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            href="/workers"
            onClick={onClose}
            className="text-brand-800 font-medium hover:underline"
          >
            Browse all local service categories →
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
