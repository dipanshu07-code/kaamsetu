'use client';

import React, { useState } from 'react';
import { Booking } from '@/types';
import { useAppStore } from '@/lib/store';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ComplaintModalProps {
  booking?: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticketNumber: string) => void;
}

export default function ComplaintModal({ booking, isOpen, onClose, onSuccess }: ComplaintModalProps) {
  const { currentUser, addComplaint } = useAppStore();

  const [category, setCategory] = useState<'no_show' | 'billing_dispute' | 'unprofessional_behavior' | 'poor_work_quality' | 'safety_concern' | 'other'>('no_show');
  const [subject, setSubject] = useState(
    booking ? `Issue with Booking #${booking.bookingNumber}` : ''
  );
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in both the subject and the details of the issue.');
      return;
    }

    const complaint = addComplaint({
      bookingId: booking?.id,
      raisedByUserId: currentUser?.id || 'u-guest',
      raisedByRole: currentUser?.role || 'customer',
      raisedByName: currentUser?.name || 'Customer',
      raisedByPhone: currentUser?.phone || '9876543210',
      accusedWorkerOrCustomerId: booking?.workerId,
      accusedName: booking?.workerName,
      category,
      subject,
      description,
    });

    onSuccess(complaint.ticketNumber);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-lg">
              Report Issue / File Grievance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-rose-600"
            >
              <option value="no_show">Worker Did Not Show Up / Severe Delay</option>
              <option value="billing_dispute">Pricing Discrepancy / Overcharging Demand</option>
              <option value="poor_work_quality">Unsatisfactory or Incomplete Work</option>
              <option value="unprofessional_behavior">Rude / Unprofessional Conduct</option>
              <option value="safety_concern">Safety or Property Damage Concern</option>
              <option value="other">Other Platform Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              placeholder="Brief summary of the issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-rose-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Please provide specific factual details (times, communications, what occurred)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:border-rose-600"
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Grievance tickets are investigated by the KaamSetu Operations Desk within 24 hours. Both parties may be contacted for mediation.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
