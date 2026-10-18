'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Booking, BookingStatus, WorkerProfile } from '@/types';
import { formatINR, formatIndianPhone } from '@/lib/utils';
import ReviewModal from '@/components/ReviewModal';
import ComplaintModal from '@/components/ComplaintModal';
import ReplacementAssistanceModal from '@/components/ReplacementAssistanceModal';
import BookingModal from '@/components/BookingModal';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Star, 
  RotateCcw, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  User, 
  Phone, 
  CreditCard, 
  FileText,
  Search,
  ArrowRight
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const { 
    currentUser, 
    bookings, 
    updateBookingStatus, 
    complaints, 
    workers 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'complaints'>('active');
  
  // Modals state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [complaintBooking, setComplaintBooking] = useState<Booking | null>(null);
  const [replacementBooking, setReplacementBooking] = useState<Booking | null>(null);
  const [rebookWorker, setRebookWorker] = useState<WorkerProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter bookings for this customer
  const customerBookings = bookings.filter(
    (b) => b.customerId === (currentUser?.id || 'u-c1')
  );

  const activeBookings = customerBookings.filter(
    (b) => ['pending', 'accepted', 'confirmed', 'in_progress'].includes(b.status)
  );

  const pastBookings = customerBookings.filter(
    (b) => ['completed', 'cancelled', 'declined', 'disputed'].includes(b.status)
  );

  const customerComplaints = complaints.filter(
    (c) => c.raisedByUserId === (currentUser?.id || 'u-c1')
  );

  const handleCancelBooking = (bookingId: string) => {
    const reason = prompt('Please state the reason for cancelling this booking:');
    if (reason === null) return; // user cancelled prompt

    updateBookingStatus(bookingId, 'cancelled', `Cancelled by customer. Reason: ${reason || 'Change of plans'}`, {
      cancelledBy: 'customer',
      cancellationReason: reason || 'Change of plans',
    });

    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (targetBooking) {
      setSuccessMessage(`Booking #${targetBooking.bookingNumber} has been cancelled.`);
      // Offer replacement assistance
      setReplacementBooking(targetBooking);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Worker Confirmation</span>;
      case 'accepted':
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Confirmed & Scheduled</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 animate-pulse">In Progress On-Site</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'declined':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">Declined by Worker</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      case 'disputed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Under Dispute</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Customer Profile Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {currentUser?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentUser?.name || 'Priya Sharma'}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Customer Account
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {formatIndianPhone(currentUser?.phone || '9812345678')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {currentUser?.locality || 'Lajpat Nagar IV'}, {currentUser?.city || 'Delhi NCR'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/workers"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs shadow-sm transition-colors text-center flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find New Worker</span>
          </Link>
          <button
            onClick={() => {
              setComplaintBooking(null);
              // open general complaint modal
              const dummyBooking = customerBookings[0];
              setComplaintBooking(dummyBooking);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>File Grievance</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'active'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active & Upcoming ({activeBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'completed'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Past Bookings & History ({pastBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-2 px-2 transition-colors relative ${
            activeTab === 'complaints'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Grievance Tickets ({customerComplaints.length})
        </button>
      </div>

      {/* Tab 1: Active Bookings */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No active or upcoming bookings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need domestic help, an electrician, or a plumber? Search nearby workers with transparent rate cards.
              </p>
              <Link
                href="/workers"
                className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-brand-800 text-white text-xs font-semibold"
              >
                Browse Local Workers
              </Link>
            </div>
          ) : (
            activeBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.workerAvatar}
                      alt={b.workerName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{b.workerName}</h3>
                        <span className="text-xs font-medium text-slate-500 capitalize">
                          ({b.workerCategory})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Booking #{b.bookingNumber} • Placed on {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(b.status)}
                  </div>
                </div>

                {/* Booking details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Service Selected</span>
                    <strong className="text-slate-900 font-bold">{b.serviceTitle}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Scheduled Slot</span>
                    <strong className="text-slate-900 font-bold">
                      {b.scheduledDate} ({b.scheduledTimeSlot})
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5 font-medium">Agreed Rate (Direct Pay)</span>
                    <strong className="text-brand-900 font-bold text-sm">
                      {formatINR(b.agreedPrice)} ({b.pricingBasis})
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  <strong>Service Address:</strong> {b.customerAddress.houseNumber}, {b.customerAddress.locality}, {b.customerAddress.city} {b.customerAddress.landmark && `(Near ${b.customerAddress.landmark})`}
                </div>

                <div className="text-xs text-slate-600">
                  <strong>Work Note:</strong> "{b.jobDescription}"
                </div>

                {/* Action Buttons for Active Booking */}
                <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setComplaintBooking(b)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                    >
                      Report Issue
                    </button>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>

                  {b.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        updateBookingStatus(b.id, 'completed', 'Completed by customer sign-off');
                        setReviewBooking(b);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Job Completion & Pay</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Past Bookings & Reviews */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {pastBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-xs text-slate-500">No completed or past bookings found.</p>
            </div>
          ) : (
            pastBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.workerAvatar}
                      alt={b.workerName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{b.workerName}</h3>
                      <p className="text-xs text-slate-500">
                        {b.serviceTitle} • Completed on {b.scheduledDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(b.status)}
                    <span className="text-xs font-bold text-slate-900">
                      {formatINR(b.agreedPrice)}
                    </span>
                  </div>
                </div>

                {b.proofOfWorkNotes && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <strong>Proof of Work Note from Worker:</strong>
                    <p>{b.proofOfWorkNotes}</p>
                  </div>
                )}

                {/* Actions: Rehire or Leave Review */}
                <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    {b.status === 'completed' && !b.hasReview && (
                      <button
                        onClick={() => setReviewBooking(b)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Leave Review & Rating</span>
                      </button>
                    )}

                    {b.status === 'completed' && b.hasReview && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Review Submitted</span>
                      </span>
                    )}

                    {b.status === 'cancelled' && (
                      <button
                        onClick={() => setReplacementBooking(b)}
                        className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Find Replacement Worker</span>
                      </button>
                    )}
                  </div>

                  {/* Rebook Previously Hired Worker */}
                  <button
                    onClick={() => {
                      const workerObj = workers.find((w) => w.id === b.workerId);
                      if (workerObj) {
                        setRebookWorker(workerObj);
                      }
                    }}
                    className="px-4 py-2 rounded-xl border border-brand-800 text-brand-800 hover:bg-brand-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rehire {b.workerName.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Complaints / Grievance Desk */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {customerComplaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-xs text-slate-500">No grievance tickets currently active.</p>
            </div>
          ) : (
            customerComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{c.ticketNumber}</span>
                    <span className="text-[11px] text-slate-500">
                      • {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    c.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                {c.resolutionNotes && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <strong className="text-slate-800">Support Desk Resolution Note:</strong>
                    <p className="text-slate-600">{c.resolutionNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isOpen={Boolean(reviewBooking)}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            setSuccessMessage('Thank you! Your verified review has been published to the worker’s Digital Passport.');
          }}
        />
      )}

      {/* Complaint Modal */}
      {complaintBooking && (
        <ComplaintModal
          booking={complaintBooking}
          isOpen={Boolean(complaintBooking)}
          onClose={() => setComplaintBooking(null)}
          onSuccess={(ticketNumber) => {
            setComplaintBooking(null);
            setSuccessMessage(`Grievance ticket #${ticketNumber} created. Our operations team will follow up.`);
          }}
        />
      )}

      {/* Replacement Assistance Modal */}
      {replacementBooking && (
        <ReplacementAssistanceModal
          booking={replacementBooking}
          isOpen={Boolean(replacementBooking)}
          onClose={() => setReplacementBooking(null)}
          onSelectAlternative={(altWorker) => {
            setReplacementBooking(null);
            setRebookWorker(altWorker);
          }}
        />
      )}

      {/* Rebook Modal */}
      {rebookWorker && (
        <BookingModal
          worker={rebookWorker}
          isOpen={Boolean(rebookWorker)}
          onClose={() => setRebookWorker(null)}
          onSuccess={(newB) => {
            setRebookWorker(null);
            setSuccessMessage(`Rebook request #${newB.bookingNumber} sent successfully!`);
          }}
        />
      )}
    </div>
  );
}
