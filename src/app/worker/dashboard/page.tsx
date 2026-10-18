'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { formatINR, formatIndianPhone } from '@/lib/utils';
import { Booking, BookingStatus, WorkerProfile } from '@/types';
import { 
  HardHat, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Star, 
  Award, 
  TrendingUp, 
  Banknote, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Camera, 
  AlertCircle,
  ExternalLink,
  Power
} from 'lucide-react';

export default function WorkerDashboardPage() {
  const { 
    currentUser, 
    workers, 
    bookings, 
    reviews, 
    setWorkerAvailability, 
    updateBookingStatus 
  } = useAppStore();

  // Find worker profile for current worker
  const workerProfile = workers.find(
    (w) => w.id === currentUser?.workerProfileId || w.userId === currentUser?.id || w.id === 'w-1'
  ) || workers[0];

  const [activeTab, setActiveTab] = useState<'incoming' | 'schedule' | 'completed' | 'passport'>('incoming');
  const [proofNote, setProofNote] = useState('');
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState('');

  // Filter bookings for this worker
  const workerBookings = bookings.filter((b) => b.workerId === workerProfile.id);

  const incomingRequests = workerBookings.filter((b) => b.status === 'pending');
  const scheduledBookings = workerBookings.filter((b) => ['accepted', 'confirmed', 'in_progress'].includes(b.status));
  const completedBookings = workerBookings.filter((b) => b.status === 'completed');

  const workerReviewsList = reviews.filter((r) => r.workerId === workerProfile.id);

  // Total direct earnings from completed jobs
  const totalEarnings = completedBookings.reduce((acc, b) => acc + b.agreedPrice, 0);

  const handleAcceptBooking = (bId: string) => {
    updateBookingStatus(bId, 'confirmed', 'Worker accepted request and confirmed time slot.');
    setSuccessBanner('Booking accepted! Customer has been notified.');
  };

  const handleDeclineBooking = (bId: string) => {
    const reason = prompt('Reason for declining (e.g. Schedule clash, outside radius):');
    if (reason === null) return;
    updateBookingStatus(bId, 'declined', `Worker declined: ${reason || 'Unavailable'}`);
    setSuccessBanner('Booking declined.');
  };

  const handleStartJob = (bId: string) => {
    updateBookingStatus(bId, 'in_progress', 'Worker arrived at premises and started work.');
    setSuccessBanner('Job marked as In Progress. Customer notified.');
  };

  const handleCompleteJob = (bId: string) => {
    updateBookingStatus(bId, 'completed', 'Worker marked job as completed.', {
      proofOfWorkNotes: proofNote || 'Work completed to customer satisfaction with safety checks.',
      paymentStatus: 'paid_directly_to_worker',
    });
    setCompletingBookingId(null);
    setProofNote('');
    setSuccessBanner('Job marked as Completed! Your Digital Passport has been updated.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Worker Banner & Availability Toggle */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={workerProfile.avatarUrl}
            alt={workerProfile.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {workerProfile.fullName}
              </h1>
              <span className="text-xs font-bold capitalize px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {workerProfile.category.replace('-', ' ')}
              </span>
              {workerProfile.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Serving {workerProfile.locality}, {workerProfile.city} • {workerProfile.experienceYears} Years Trade Experience
            </p>
          </div>
        </div>

        {/* Availability Switch */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Duty Status
            </span>
            <span className={`text-xs font-bold ${workerProfile.isAvailableToday ? 'text-emerald-700' : 'text-slate-500'}`}>
              {workerProfile.isAvailableToday ? '🟢 Online (Available Today)' : '⚪ Off-Duty (Advance Only)'}
            </span>
          </div>

          <button
            onClick={() => setWorkerAvailability(workerProfile.id, !workerProfile.isAvailableToday)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              workerProfile.isAvailableToday
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{workerProfile.isAvailableToday ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Earnings</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{formatINR(totalEarnings)}</span>
          <span className="text-[11px] text-emerald-700 block mt-1 font-medium">100% Retained (0% Platform Cut)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{incomingRequests.length}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Requires your acceptance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Jobs</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{workerProfile.completedJobsCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">On Digital Work Passport</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <span className="text-2xl font-black text-slate-900">{workerProfile.rating.toFixed(1)}</span>
          <span className="text-[11px] text-slate-500 block mt-1">From {workerReviewsList.length} verified clients</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'incoming'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Incoming Requests ({incomingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'schedule'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Schedule ({scheduledBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'completed'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Work History ({completedBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('passport')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'passport'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Digital Work Passport
        </button>
      </div>

      {/* Tab 1: Incoming Booking Requests */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">No incoming booking requests right now</h3>
              <p className="text-xs text-slate-500">
                Ensure your Duty Status is turned <strong>Online</strong> so nearby customers can discover you.
              </p>
            </div>
          ) : (
            incomingRequests.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      New Booking Request #{b.bookingNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {b.serviceTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      From {b.customerName} • {formatIndianPhone(b.customerPhone)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Proposed Fee:</span>
                    <span className="text-lg font-black text-brand-900">
                      {formatINR(b.agreedPrice)} ({b.pricingBasis})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-500 font-medium block">Requested Slot:</span>
                    <strong className="text-slate-900">{b.scheduledDate} ({b.scheduledTimeSlot})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Customer Location:</span>
                    <strong className="text-slate-900">
                      {b.customerAddress.houseNumber}, {b.customerAddress.locality}, {b.customerAddress.city}
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  <strong>Job Requirement:</strong> "{b.jobDescription}"
                </div>

                {/* Accept / Decline actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleDeclineBooking(b.id)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={() => handleAcceptBooking(b.id)}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Booking</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Active Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {scheduledBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-xs text-slate-500">No confirmed jobs scheduled for today.</p>
            </div>
          ) : (
            scheduledBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{b.serviceTitle}</h3>
                      <span className="text-xs font-bold text-brand-900">
                        {formatINR(b.agreedPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Client: {b.customerName} • {formatIndianPhone(b.customerPhone)}
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    b.status === 'in_progress' ? 'bg-teal-100 text-teal-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {b.status === 'in_progress' ? 'Currently In Progress' : 'Confirmed'}
                  </span>
                </div>

                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong>Location:</strong> {b.customerAddress.houseNumber}, {b.customerAddress.locality}, {b.customerAddress.city} {b.customerAddress.landmark && `(Near ${b.customerAddress.landmark})`}
                </div>

                {/* Progress / Completion Form */}
                {completingBookingId === b.id ? (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-emerald-900">
                      Add Proof of Work & Complete Job
                    </h4>
                    <textarea
                      rows={2}
                      placeholder="Add brief note for client and passport (e.g. replaced fan capacitor, balanced regulator, wiring tested safe)..."
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      className="w-full text-xs border border-emerald-300 rounded-xl p-2.5 bg-white"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setCompletingBookingId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCompleteJob(b.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                      >
                        Submit & Complete Job
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                    <span className="text-xs text-slate-500">
                      Slot: <strong>{b.scheduledDate} ({b.scheduledTimeSlot})</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {b.status !== 'in_progress' && (
                        <button
                          onClick={() => handleStartJob(b.id)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          Mark Arrived / In Progress
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setCompletingBookingId(b.id);
                          setProofNote('');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                      >
                        Complete Job & Log Proof
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Completed Jobs */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-xs text-slate-500">No completed jobs yet.</p>
            </div>
          ) : (
            completedBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{b.serviceTitle}</h3>
                    <p className="text-xs text-slate-500">
                      Booking #{b.bookingNumber} • Client: {b.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 block">
                      Paid Direct: {formatINR(b.agreedPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(b.updatedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                {b.proofOfWorkNotes && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <strong>Logged Proof:</strong> {b.proofOfWorkNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Passport Preview */}
      {activeTab === 'passport' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Your Public Digital Work Passport
              </h2>
              <p className="text-xs text-slate-500">
                This is how potential customers view your skills, ratings, and experience.
              </p>
            </div>
            <Link
              href={`/workers/${workerProfile.id}`}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Phone Verification</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Colony Address Check</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Field Screening Done
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Total Verified Jobs</span>
              <strong className="text-slate-900 text-base font-bold">
                {workerProfile.completedJobsCount}
              </strong>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recent Job-Linked Customer Reviews ({workerReviewsList.length})
            </h3>
            <div className="space-y-3">
              {workerReviewsList.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.customerName}</span>
                    <span className="text-amber-500 font-bold">★ {r.rating}</span>
                  </div>
                  <p className="text-slate-600 italic">"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
