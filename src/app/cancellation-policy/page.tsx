'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-800 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Policy Document
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
          Cancellation & Replacement Policy
        </h1>
        <p className="text-xs text-slate-500">
          Last updated: October 2026 • KaamSetu Marketplace Protocol
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">1. Customer Cancellation Policy</h2>
          <p>
            Because KaamSetu charges zero advance fees, customers may cancel pending or confirmed requests without financial penalty. However, to respect the worker’s livelihood and travel time:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Up to 2 hours before the scheduled slot:</strong> Free cancellation with zero penalty.</li>
            <li><strong>After the worker has arrived at premises:</strong> If you cancel without cause after the worker has arrived with tools, you are requested to compensate the worker with a minimum courtesy visiting charge (₹150–₹250).</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">2. Worker Cancellation & Replacement Assistance</h2>
          <p>
            If a confirmed worker encounters an unforeseen emergency or transit delay and must cancel:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>The booking status is updated to <strong>Cancelled</strong> with the specific logged reason.</li>
            <li>KaamSetu activates the <strong>Replacement Assistance Desk</strong> on the customer’s dashboard, displaying other verified workers available in the same locality.</li>
            <li>We do not automatically dispatch replacement workers without customer consent.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">3. Direct Settlement & Refund Clarification</h2>
          <p>
            Payments are settled directly between you and the worker via Cash or UPI upon satisfactory completion. KaamSetu does not hold customer escrow funds. In the event of a billing dispute or incomplete job, you may withhold balance payment and file a ticket at our Grievance Desk for investigation.
          </p>
        </section>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
          <span>Need help with a disputed booking?</span>
          <Link
            href="/grievance"
            className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            File a Grievance Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}
