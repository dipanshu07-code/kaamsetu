'use client';

import React from 'react';
import { getEstimatedPriceRange, formatINR } from '@/lib/utils';
import { TrendingUp, Info, ShieldCheck } from 'lucide-react';

interface PriceIntelligenceCardProps {
  categorySlug: string;
  locality?: string;
}

export default function PriceIntelligenceCard({ categorySlug, locality }: PriceIntelligenceCardProps) {
  const estimate = getEstimatedPriceRange(categorySlug);

  return (
    <div className="bg-gradient-to-br from-brand-50/70 via-white to-teal-50/50 rounded-2xl border border-brand-200/60 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-800 text-white flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
              Local Price Intelligence
            </h4>
            <p className="text-[11px] text-slate-500">
              Locality Benchmark: {locality || 'NCR & Metro Residential Zones'}
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Transparent Data
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-black text-brand-900">
          {formatINR(estimate.min)} – {formatINR(estimate.max)}
        </span>
        <span className="text-xs text-slate-600 font-medium">
          {estimate.basis}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed mb-3">
        {estimate.disclaimer}
      </p>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-brand-100">
        <Info className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
        <span>
          Final price is mutually confirmed by you and the worker before job execution. No hidden platform markup.
        </span>
      </div>
    </div>
  );
}
