'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatINR, formatIndianPhone } from '@/lib/utils';
import { 
  ShieldAlert, 
  Users, 
  HardHat, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Layers, 
  History, 
  FileText, 
  Check, 
  X,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { 
    currentUser, 
    workers, 
    bookings, 
    complaints, 
    auditLogs, 
    categories, 
    verifyWorker, 
    resolveComplaint, 
    toggleCategory,
    updateBookingStatus 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'kpis' | 'verifications' | 'complaints' | 'bookings' | 'categories' | 'logs'>('kpis');
  const [resolutionInput, setResolutionInput] = useState<{ [id: string]: string }>({});
  const [successNote, setSuccessNote] = useState('');

  // Access check
  const isAdmin = currentUser?.role === 'admin';

  // Analytics Metrics
  const totalBookingsCount = bookings.length;
  const completedJobsCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledBookingsCount = bookings.filter((b) => b.status === 'cancelled').length;
  const cancellationRate = totalBookingsCount > 0 
    ? Math.round((cancelledBookingsCount / totalBookingsCount) * 100) 
    : 0;

  const totalComplaintsCount = complaints.length;
  const complaintRate = totalBookingsCount > 0
    ? ((totalComplaintsCount / totalBookingsCount) * 100).toFixed(1)
    : '0';

  const pendingVerifications = workers.filter((w) => w.verificationStatus === 'pending');
  const openComplaints = complaints.filter((c) => c.status === 'open' || c.status === 'under_investigation');

  const handleApproveWorker = (wId: string) => {
    const notes = prompt('Enter verification approval notes (e.g. Phone verified, colony reference approved):');
    if (notes === null) return;
    verifyWorker(wId, notes || 'Verified by admin operations lead');
    setSuccessNote('Worker verification approved! Badge has been activated on their passport.');
  };

  const handleResolveTicket = (complaintId: string) => {
    const note = resolutionInput[complaintId];
    if (!note || !note.trim()) {
      alert('Please enter a resolution summary.');
      return;
    }
    resolveComplaint(complaintId, note);
    setSuccessNote('Grievance ticket resolved and audit logged.');
    setResolutionInput({ ...resolutionInput, [complaintId]: '' });
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Protected Administrator Portal</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You are currently viewing as <strong>{currentUser?.role || 'Guest'}</strong>. 
          Use the top interactive toolbar to switch into <strong>Admin Mode</strong> to inspect operations, audit logs, and verifications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black">
              Platform Operations & Governance Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Admin Oversight • Pilot Regions (Delhi NCR, Bengaluru, Mumbai, Pune)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            System Operational
          </span>
        </div>
      </div>

      {successNote && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{successNote}</span>
          <button onClick={() => setSuccessNote('')} className="font-bold">✕</button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Workers</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{workers.length}</span>
          <span className="text-[10px] text-teal-700 font-medium">{workers.filter(w => w.verificationStatus === 'verified').length} Verified</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalBookingsCount}</span>
          <span className="text-[10px] text-blue-700 font-medium">All Statuses</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Jobs</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{completedJobsCount}</span>
          <span className="text-[10px] text-emerald-700 font-medium">Successful Deliveries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancellation Rate</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{cancellationRate}%</span>
          <span className="text-[10px] text-slate-500 font-medium">{cancelledBookingsCount} Cancelled</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grievance Rate</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{complaintRate}%</span>
          <span className="text-[10px] text-rose-700 font-medium">{openComplaints.length} Open Tickets</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repeat Booking %</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">38%</span>
          <span className="text-[10px] text-emerald-700 font-medium">Pilot Retention</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-2 px-3 whitespace-nowrap ${
            activeTab === 'kpis' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview & Queue
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`pb-2 px-3 whitespace-nowrap ${
            activeTab === 'verifications' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Worker Verifications ({pendingVerifications.length})
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-2 px-3 whitespace-nowrap ${
            activeTab === 'complaints' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Dispute & Grievances ({openComplaints.length})
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-2 px-3 whitespace-nowrap ${
            activeTab === 'bookings' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Booking Management ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2 px-3 whitespace-nowrap ${
            activeTab === 'categories' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Service Safeguards
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2 px-3 whitespace-nowrap ${
            activeTab === 'logs' ? 'text-brand-900 border-b-2 border-brand-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Overview Queue */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Queue 1: Pending Verifications */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HardHat className="w-4 h-4 text-teal-600" />
                <span>Pending Worker Verifications</span>
              </h3>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                {pendingVerifications.length} Pending
              </span>
            </div>

            {pendingVerifications.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">All registered workers have been reviewed.</p>
            ) : (
              <div className="space-y-3">
                {pendingVerifications.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-slate-900 font-bold block">{w.fullName}</strong>
                      <span className="text-slate-500 capitalize">{w.category.replace('-', ' ')} • {w.locality}</span>
                    </div>
                    <button
                      onClick={() => handleApproveWorker(w.id)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
                    >
                      Verify Badge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Queue 2: Open Complaints */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Open Grievances</span>
              </h3>
              <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                {openComplaints.length} Open
              </span>
            </div>

            {openComplaints.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">No open grievance tickets.</p>
            ) : (
              <div className="space-y-3">
                {openComplaints.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900">{c.ticketNumber} - {c.subject}</strong>
                      <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">{c.category}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{c.description}</p>
                    <button
                      onClick={() => setActiveTab('complaints')}
                      className="text-brand-800 font-semibold hover:underline"
                    >
                      Resolve in Grievance Tab →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Verifications Queue */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Worker Verification Queue</h3>
          <p className="text-xs text-slate-500">
            Admins assess trade proof and colony references before issuing the "Verified Worker" badge.
          </p>

          <div className="space-y-4 pt-2">
            {workers.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img src={w.avatarUrl} alt={w.fullName} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{w.fullName}</h4>
                    <p className="text-slate-500">
                      {w.category} • {w.locality}, {w.city} • {formatIndianPhone(w.phone)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        Status: {w.verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/workers/${w.id}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100"
                  >
                    Inspect Profile
                  </Link>

                  {w.verificationStatus !== 'verified' ? (
                    <button
                      onClick={() => handleApproveWorker(w.id)}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-sm"
                    >
                      Approve Verification
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Complaints Resolution */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Dispute & Grievance Resolution Desk</h3>
          <p className="text-xs text-slate-500">
            Investigate customer or worker grievances, add resolution summaries, and close tickets.
          </p>

          <div className="space-y-4 pt-2">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-bold">{c.ticketNumber}</strong>
                    <span className="text-slate-400">• Raised by {c.raisedByName} ({c.raisedByRole})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">{c.description}</p>
                </div>

                {c.status === 'resolved' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    <strong>Resolution Record:</strong> {c.resolutionNotes} (Resolved at {c.resolvedAt})
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Enter Official Resolution Notes:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Spoke to both customer and worker. Worker acknowledged delay and apologized. Mutual understanding reached."
                      value={resolutionInput[c.id] || ''}
                      onChange={(e) => setResolutionInput({ ...resolutionInput, [c.id]: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleResolveTicket(c.id)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
                      >
                        Submit Resolution & Close Ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Booking Management & Status History</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Ref #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Worker</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{b.bookingNumber}</td>
                    <td className="p-3">{b.customerName}</td>
                    <td className="p-3">{b.workerName}</td>
                    <td className="p-3">{b.serviceTitle}</td>
                    <td className="p-3 font-semibold text-brand-900">{formatINR(b.agreedPrice)}</td>
                    <td className="p-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed', 'Admin force confirmed')}
                          className="text-xs text-brand-800 hover:underline font-semibold"
                        >
                          Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Categories Safeguard */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Service Safeguarding Controls</h3>
          <p className="text-xs text-slate-500">
            Enable or pause categories depending on policy and local compliance. (Childcare remains paused for safety).
          </p>

          <div className="space-y-3 pt-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-bold text-slate-900 text-sm">{c.name}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.isEnabled ? 'Active' : 'Safeguard Paused'}
                    </span>
                  </div>
                  {c.disabledReason && (
                    <p className="text-slate-500 mt-1 leading-relaxed text-[11px]">{c.disabledReason}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    const reason = c.isEnabled ? prompt('Enter reason for pausing category:') : undefined;
                    toggleCategory(c.slug, !c.isEnabled, reason || undefined);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    c.isEnabled
                      ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {c.isEnabled ? 'Pause Category' : 'Enable Category'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Administrative Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Immutable log of all approvals, ticket resolutions, and category state adjustments.
          </p>

          <div className="space-y-3 pt-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px] font-mono">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-slate-700">{log.details}</p>
                <span className="text-[10px] text-slate-400 block">By: {log.adminName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
