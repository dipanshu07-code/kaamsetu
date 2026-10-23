'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { getEstimatedPriceRange, formatINR } from '@/lib/utils';
import { useI18n, MessageKey } from '@/lib/i18n';

/**
 * Typical price guide for a category. These ranges are hand-written guides in
 * lib/utils.ts, not live market data, and the card says so.
 */
export default function PriceIntelligenceCard({ categorySlug }: { categorySlug: string; locality?: string }) {
  const { t, tk } = useI18n();
  const estimate = getEstimatedPriceRange(categorySlug);
  const basisKey = `priceGuide.${categorySlug}` as MessageKey;
  const basis = t(basisKey) === basisKey ? t('priceGuide.default') : t(basisKey);
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm font-semibold text-stone-900">
        {t('priceGuide.title', { category: tk('cat', categorySlug) })}
      </p>
      <p className="mt-1 text-xl font-bold text-stone-900">
        {formatINR(estimate.min)} – {formatINR(estimate.max)} <span className="text-sm font-normal text-stone-600">{basis}</span>
      </p>
      <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-600">
        <Info className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
        {t('priceGuide.disclaimer')}
      </p>
    </div>
  );
}
