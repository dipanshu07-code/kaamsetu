'use client';

import React, { useState } from 'react';
import { WorkerProfile, Booking, PricingBasis } from '@/types';
import { useAppStore } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Banknote, 
  ShieldCheck 
} from 'lucide-react';

interface BookingModalProps {
  worker: WorkerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export default function BookingModal({ worker, isOpen, onClose, onSuccess }: BookingModalProps) {
  const { currentUser, createBooking } = useAppStore();

  const [serviceTitle, setServiceTitle] = useState(
    worker.rateCards[0]?.serviceTitle || `${worker.category} General Service`
  );
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  );
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('Morning (9am-1pm)');
  const [houseNumber, setHouseNumber] = useState('Flat 402, Royal Palms');
  const [locality, setLocality] = useState(worker.locality || 'Lajpat Nagar');
  const [city, setCity] = useState(worker.city || 'Delhi NCR');
  const [pincode, setPincode] = useState('110024');
  const [landmark, setLandmark] = useState('Near Community Center');
  const [jobDescription, setJobDescription] = useState('');
  const [pricingBasis, setPricingBasis] = useState<PricingBasis>(worker.pricingBasis);
  const [agreedPrice, setAgreedPrice] = useState<number>(worker.baseRate);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_completion' | 'upi_direct'>('upi_direct');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRateCardSelect = (title: string, amount: number, basis: PricingBasis) => {
    setServiceTitle(title);
    setAgreedPrice(amount);
    setPricingBasis(basis);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!jobDescription.trim()) {
      setError('Please provide a short description of the work needed.');
      return;
    }
    if (!houseNumber.trim() || !locality.trim()) {
      setError('Please enter a valid address and locality.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = createBooking({
        customerId: currentUser?.id || 'u-c-guest',
        customerName: currentUser?.name || 'Customer',
        customerPhone: currentUser?.phone || '9876500000',
        workerId: worker.id,
        workerName: worker.fullName,
        workerCategory: worker.category,
        workerAvatar: worker.avatarUrl,
        workerPhone: worker.phone,
        status: 'pending',
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            note: 'Booking request placed by customer.',
          },
        ],
        serviceTitle,
        serviceCategory: worker.category,
        scheduledDate,
        scheduledTimeSlot,
        customerAddress: {
          houseNumber,
          locality,
          city,
          pincode,
          landmark,
        },
        jobDescription,
        pricingBasis,
        agreedPrice,
        paymentMethod,
        paymentStatus: 'pending',
      });

      setIsSubmitting(false);
      onSuccess(newBooking);
    } catch (err) {
      setIsSubmitting(false);
      setError('Failed to create booking. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img
              src={worker.avatarUrl}
              alt={worker.fullName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                Request Booking
              </h2>
              <p className="text-xs text-slate-500">
                with {worker.fullName} • {worker.locality}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Service Selection & Rate Card */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Choose Service & Rate
            </label>
            <div className="grid grid-cols-1 gap-2">
              {worker.rateCards.map((rc) => (
                <div
                  key={rc.id}
                  onClick={() => handleRateCardSelect(rc.serviceTitle, rc.amount, rc.pricingBasis)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    serviceTitle === rc.serviceTitle
                      ? 'border-brand-700 bg-brand-50/70 ring-1 ring-brand-700'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      {rc.serviceTitle}
                    </span>
                    <span className="font-bold text-brand-900 text-xs">
                      {formatINR(rc.amount)} ({rc.pricingBasis})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {rc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Schedule Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Preferred Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Time Window
              </label>
              <select
                value={scheduledTimeSlot}
                onChange={(e) => setScheduledTimeSlot(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
              >
                <option value="Morning (8:00 AM - 12:00 PM)">Morning (8:00 AM - 12:00 PM)</option>
                <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                <option value="Evening (4:00 PM - 8:00 PM)">Evening (4:00 PM - 8:00 PM)</option>
              </select>
            </div>
          </div>

          {/* 3. Address Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              3. Service Location
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="House / Flat / Building No."
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Locality / Sector / Colony"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="PIN Code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800"
                />
                <input
                  type="text"
                  placeholder="Nearest Landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:border-brand-800"
                />
              </div>
            </div>
          </div>

          {/* 4. Job Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              4. Specific Job Details
            </label>
            <textarea
              rows={3}
              placeholder="Describe what needs to be done (e.g. 2 leaking taps in kitchen, have purchased spare parts, stairs access on 3rd floor)..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:border-brand-800"
            />
          </div>

          {/* 5. Pricing and Direct Payment Disclosure */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Estimated Agreed Price:</span>
              <span className="text-base font-bold text-brand-900">
                {formatINR(agreedPrice)} ({pricingBasis})
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Settlement Method (Pay Directly to Worker Upon Satisfactory Completion):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'upi_direct'}
                    onChange={() => setPaymentMethod('upi_direct')}
                    className="text-brand-800 focus:ring-brand-800"
                  />
                  <span>Direct UPI / QR</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cash_on_completion'}
                    onChange={() => setPaymentMethod('cash_on_completion')}
                    className="text-brand-800 focus:ring-brand-800"
                  />
                  <span>Cash on Completion</span>
                </label>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>
                Zero platform commission charged to worker. 100% of your payment goes directly into the worker’s pocket.
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
