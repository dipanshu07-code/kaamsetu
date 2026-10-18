'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import ComplaintModal from '@/components/ComplaintModal';
import { ShieldAlert, Search, AlertTriangle, CheckCircle2, Phone, Mail } from 'lucide-react';

export default function GrievancePage() {
  const { complaints, currentUser } = useAppStore();
  const [ticketSearch, setTicketSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<string | null>(null);

  const searchedComplaint = complaints.find(
    (c) => c.ticketNumber.toLowerCase() === ticketSearch.trim().toLowerCase()
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Trust & Accountability
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Grievance Redressal & Support Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We take service quality, pricing integrity, and mutual safety seriously. Every submitted ticket is investigated by our operations officers within 24 business hours.
        </p>
      </div>

      {createdTicket && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              Your grievance ticket <strong>#{createdTicket}</strong> has been registered. You can track its status below.
            </span>
          </div>
          <button onClick={() => setCreatedTicket(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Ticket Tracker Bar & Action Button */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex-1 max-w-md">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Track Existing Ticket
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Enter ticket number (e.g. TKT-2026-041)..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 focus:border-rose-600"
              />
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto self-end px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Submit New Grievance</span>
          </button>
        </div>

        {/* Searched Ticket Result Card */}
        {ticketSearch.trim() && (
          <div className="pt-4 border-t border-slate-100">
            {searchedComplaint ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {searchedComplaint.ticketNumber}: {searchedComplaint.subject}
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Category: {searchedComplaint.category} • Raised on {new Date(searchedComplaint.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    searchedComplaint.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {searchedComplaint.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700">
                  <strong>Complaint Details:</strong> "{searchedComplaint.description}"
                </div>

                {searchedComplaint.resolutionNotes && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
                    <strong>Support Desk Resolution:</strong> {searchedComplaint.resolutionNotes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No ticket found with reference "{ticketSearch}".
              </p>
            )}
          </div>
        )}
      </div>

      {/* Escalation Helpline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <Phone className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-sm">Emergency Escalation Helpline</h3>
          <p className="text-slate-600">
            For critical safety concerns or immediate site issues: <br />
            <strong className="text-slate-900">+91 11 4050 8899</strong> (Mon–Sat, 9:00 AM – 7:00 PM IST)
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <Mail className="w-5 h-5 text-brand-800" />
          <h3 className="font-bold text-slate-900 text-sm">Grievance Officer Email</h3>
          <p className="text-slate-600">
            Formal written appeals regarding worker conduct or platform policies: <br />
            <strong className="text-slate-900">grievance@kaamsetu.org.in</strong>
          </p>
        </div>
      </div>

      {isModalOpen && (
        <ComplaintModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(ticketNumber) => {
            setIsModalOpen(false);
            setCreatedTicket(ticketNumber);
            setTicketSearch(ticketNumber);
          }}
        />
      )}
    </div>
  );
}
