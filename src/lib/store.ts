'use client';

import { useState, useEffect } from 'react';
import { 
  AppUser, 
  Booking, 
  BookingStatus, 
  Complaint, 
  Review, 
  ServiceCategory, 
  WorkerProfile, 
  AdminAuditLog,
  ServiceCategorySlug
} from '@/types';
import { 
  demoAccounts, 
  initialBookings, 
  initialComplaints, 
  initialReviews, 
  initialWorkers, 
  serviceCategories, 
  initialAuditLogs 
} from './mock-data';

const STORAGE_KEY = 'kaamsetu_state_v1';

interface StateData {
  language: 'en' | 'hi';
  currentUser: AppUser | null;
  workers: WorkerProfile[];
  bookings: Booking[];
  reviews: Review[];
  complaints: Complaint[];
  auditLogs: AdminAuditLog[];
  categories: ServiceCategory[];
}

function getInitialState(): StateData {
  if (typeof window === 'undefined') {
    return {
      language: 'en',
      currentUser: demoAccounts.customer,
      workers: initialWorkers,
      bookings: initialBookings,
      reviews: initialReviews,
      complaints: initialComplaints,
      auditLogs: initialAuditLogs,
      categories: serviceCategories,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        language: parsed.language || 'en',
        currentUser: parsed.currentUser || demoAccounts.customer,
        workers: parsed.workers?.length ? parsed.workers : initialWorkers,
        bookings: parsed.bookings?.length ? parsed.bookings : initialBookings,
        reviews: parsed.reviews?.length ? parsed.reviews : initialReviews,
        complaints: parsed.complaints?.length ? parsed.complaints : initialComplaints,
        auditLogs: parsed.auditLogs?.length ? parsed.auditLogs : initialAuditLogs,
        categories: parsed.categories?.length ? parsed.categories : serviceCategories,
      };
    }
  } catch (e) {
    console.error('Error loading stored state, using defaults', e);
  }

  return {
    language: 'en',
    currentUser: demoAccounts.customer,
    workers: initialWorkers,
    bookings: initialBookings,
    reviews: initialReviews,
    complaints: initialComplaints,
    auditLogs: initialAuditLogs,
    categories: serviceCategories,
  };
}

// Global subscribers for reactive updates across components
type Listener = () => void;
const listeners = new Set<Listener>();

let memoryState: StateData = getInitialState();

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }
  listeners.forEach((l) => l());
}

export function useAppStore() {
  const [state, setState] = useState<StateData>(memoryState);

  useEffect(() => {
    // Sync with memory on mount
    setState({ ...memoryState });
    const listener = () => setState({ ...memoryState });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setLanguage = (lang: 'en' | 'hi') => {
    memoryState = { ...memoryState, language: lang };
    notify();
  };

  const switchRole = (role: 'customer' | 'worker' | 'admin') => {
    memoryState = { ...memoryState, currentUser: demoAccounts[role] };
    notify();
  };

  const loginUser = (user: AppUser) => {
    memoryState = { ...memoryState, currentUser: user };
    notify();
  };

  const logout = () => {
    memoryState = { ...memoryState, currentUser: null };
    notify();
  };

  const createBooking = (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt' | 'updatedAt' | 'hasReview'>) => {
    const newId = `b-${Date.now()}`;
    const newNumber = `KS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newBooking: Booking = {
      ...bookingData,
      id: newId,
      bookingNumber: newNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasReview: false,
    };

    memoryState = {
      ...memoryState,
      bookings: [newBooking, ...memoryState.bookings],
    };
    notify();
    return newBooking;
  };

  const updateBookingStatus = (
    bookingId: string, 
    status: BookingStatus, 
    note?: string,
    extraFields?: Partial<Booking>
  ) => {
    memoryState = {
      ...memoryState,
      bookings: memoryState.bookings.map((b) => {
        if (b.id !== bookingId) return b;
        const newHistory = [
          ...b.statusHistory,
          {
            status,
            timestamp: new Date().toISOString(),
            note: note || `Status changed to ${status}`,
          },
        ];
        return {
          ...b,
          status,
          statusHistory: newHistory,
          updatedAt: new Date().toISOString(),
          ...extraFields,
        };
      }),
    };
    notify();
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Update worker rating and count
    const updatedWorkers = memoryState.workers.map((w) => {
      if (w.id !== review.workerId) return w;
      const totalRatings = w.rating * w.reviewCount + review.rating;
      const newCount = w.reviewCount + 1;
      const newRating = Number((totalRatings / newCount).toFixed(1));
      return {
        ...w,
        rating: newRating,
        reviewCount: newCount,
      };
    });

    // Mark booking as reviewed
    const updatedBookings = memoryState.bookings.map((b) => {
      if (b.id !== review.bookingId) return b;
      return { ...b, hasReview: true };
    });

    memoryState = {
      ...memoryState,
      reviews: [newReview, ...memoryState.reviews],
      workers: updatedWorkers,
      bookings: updatedBookings,
    };
    notify();
  };

  const addComplaint = (complaint: Omit<Complaint, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => {
    const newComplaint: Complaint = {
      ...complaint,
      id: `comp-${Date.now()}`,
      ticketNumber: `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    memoryState = {
      ...memoryState,
      complaints: [newComplaint, ...memoryState.complaints],
    };
    notify();
    return newComplaint;
  };

  const resolveComplaint = (complaintId: string, resolutionNotes: string) => {
    memoryState = {
      ...memoryState,
      complaints: memoryState.complaints.map((c) => {
        if (c.id !== complaintId) return c;
        return {
          ...c,
          status: 'resolved',
          resolutionNotes,
          resolvedAt: new Date().toISOString(),
        };
      }),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          adminId: memoryState.currentUser?.id || 'admin',
          adminName: memoryState.currentUser?.name || 'Administrator',
          action: 'COMPLAINT_RESOLVED',
          targetType: 'complaint',
          targetId: complaintId,
          details: `Resolution note: "${resolutionNotes}"`,
          timestamp: new Date().toISOString(),
        },
        ...memoryState.auditLogs,
      ],
    };
    notify();
  };

  const setWorkerAvailability = (workerId: string, isAvailable: boolean) => {
    memoryState = {
      ...memoryState,
      workers: memoryState.workers.map((w) => {
        if (w.id !== workerId) return w;
        return { ...w, isAvailableToday: isAvailable };
      }),
    };
    notify();
  };

  const verifyWorker = (workerId: string, adminNotes: string) => {
    memoryState = {
      ...memoryState,
      workers: memoryState.workers.map((w) => {
        if (w.id !== workerId) return w;
        return {
          ...w,
          verificationStatus: 'verified',
          verificationDetails: {
            isIdentityVerified: true,
            isBackgroundChecked: true,
            isSkillEndorsed: true,
            verificationDate: new Date().toISOString().split('T')[0],
          },
        };
      }),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          adminId: memoryState.currentUser?.id || 'admin',
          adminName: memoryState.currentUser?.name || 'Administrator',
          action: 'WORKER_VERIFICATION_APPROVED',
          targetType: 'worker',
          targetId: workerId,
          details: `Verified worker credentials with admin notes: ${adminNotes}`,
          timestamp: new Date().toISOString(),
        },
        ...memoryState.auditLogs,
      ],
    };
    notify();
  };

  const registerWorker = (newWorker: Omit<WorkerProfile, 'id' | 'rating' | 'reviewCount' | 'completedJobsCount' | 'onTimeArrivalRatePercent' | 'isDemoProfile' | 'verificationStatus'>) => {
    const workerId = `w-${Date.now()}`;
    const profile: WorkerProfile = {
      ...newWorker,
      id: workerId,
      rating: 5.0,
      reviewCount: 0,
      completedJobsCount: 0,
      onTimeArrivalRatePercent: 100,
      isDemoProfile: false,
      verificationStatus: 'pending',
    };

    memoryState = {
      ...memoryState,
      workers: [profile, ...memoryState.workers],
    };
    notify();
    return profile;
  };

  const toggleCategory = (slug: ServiceCategorySlug, isEnabled: boolean, reason?: string) => {
    memoryState = {
      ...memoryState,
      categories: memoryState.categories.map((cat) => {
        if (cat.slug !== slug) return cat;
        return {
          ...cat,
          isEnabled,
          disabledReason: isEnabled ? undefined : (reason || 'Disabled by platform administrator'),
        };
      }),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          adminId: memoryState.currentUser?.id || 'admin',
          adminName: memoryState.currentUser?.name || 'Administrator',
          action: isEnabled ? 'CATEGORY_ENABLED' : 'CATEGORY_DISABLED',
          targetType: 'category',
          targetId: slug,
          details: isEnabled ? `Enabled service category ${slug}` : `Disabled category ${slug}: ${reason}`,
          timestamp: new Date().toISOString(),
        },
        ...memoryState.auditLogs,
      ]
    };
    notify();
  };

  const resetToDefault = () => {
    memoryState = {
      language: 'en',
      currentUser: demoAccounts.customer,
      workers: initialWorkers,
      bookings: initialBookings,
      reviews: initialReviews,
      complaints: initialComplaints,
      auditLogs: initialAuditLogs,
      categories: serviceCategories,
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    notify();
  };

  return {
    ...state,
    setLanguage,
    switchRole,
    loginUser,
    logout,
    createBooking,
    updateBookingStatus,
    addReview,
    addComplaint,
    resolveComplaint,
    setWorkerAvailability,
    verifyWorker,
    registerWorker,
    toggleCategory,
    resetToDefault,
  };
}
