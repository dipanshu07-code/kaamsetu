'use client';

import React, { useState } from 'react';
import { Booking } from '@/types';
import { useAppStore } from '@/lib/store';
import { X, Star, ShieldCheck, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ booking, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const { addReview } = useAppStore();

  const [rating, setRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [workQualityRating, setWorkQualityRating] = useState(5);
  const [politenessRating, setPolitenessRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please share a few words about your experience with the worker.');
      return;
    }

    addReview({
      bookingId: booking.id,
      workerId: booking.workerId,
      customerId: booking.customerId,
      customerName: booking.customerName,
      customerLocality: booking.customerAddress.locality,
      rating,
      punctualityRating,
      workQualityRating,
      politenessRating,
      comment,
      isVerifiedJob: true,
    });

    onSuccess();
  };

  const renderStars = (value: number, onChange: (val: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              Rate & Review Completed Job
            </h3>
            <p className="text-xs text-slate-500">
              For Booking #{booking.bookingNumber} • {booking.workerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Overall Rating */}
          <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-600 block mb-1">
              Overall Experience
            </span>
            <div className="flex justify-center">
              {renderStars(rating, setRating)}
            </div>
          </div>

          {/* Specific Attributes */}
          <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Punctuality (Arrived on time):</span>
              {renderStars(punctualityRating, setPunctualityRating)}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Work Quality & Competence:</span>
              {renderStars(workQualityRating, setWorkQualityRating)}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Politeness & Household Respect:</span>
              {renderStars(politenessRating, setPolitenessRating)}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Feedback
            </label>
            <textarea
              rows={4}
              placeholder="How was the service? Did the worker arrive with proper tools? Was the pricing respected?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:border-brand-800"
              required
            />
          </div>

          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-xl text-xs border border-emerald-200">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>
              This review will be published as a <strong>Job-Linked Verified Review</strong> on the worker’s Digital Passport.
            </span>
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
              className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 shadow-sm"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
