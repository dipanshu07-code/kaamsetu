export type UserRole = 'customer' | 'worker' | 'employer' | 'admin';

export type ServiceCategorySlug = 
  | 'maid-housekeeping'
  | 'cook'
  | 'electrician'
  | 'plumber'
  | 'carpenter'
  | 'general-labour'
  | 'shifting-assistant'
  | 'construction'
  | 'childcare'; // Disabled initially for safeguarding

export interface ServiceCategory {
  id: string;
  name: string;
  nameHi: string;
  slug: ServiceCategorySlug;
  iconName: string;
  description: string;
  descriptionHi: string;
  startingPrice: number;
  priceUnit: 'per-visit' | 'per-hour' | 'per-day' | 'per-month' | 'quoted';
  isEnabled: boolean;
  disabledReason?: string;
  popularServices: string[];
}

export type PricingBasis = 'per-visit' | 'per-hour' | 'per-day' | 'per-month' | 'quoted';

export interface RateCard {
  id: string;
  serviceCategorySlug: ServiceCategorySlug;
  serviceTitle: string;
  pricingBasis: PricingBasis;
  amount: number;
  description: string;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationRecord {
  id: string;
  workerId: string;
  phoneVerified: boolean;
  addressVerified: boolean;
  skillsAssessed: boolean;
  policeVerificationFiled: boolean;
  verifiedAt?: string;
  verifierNotes?: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  fullName: string;
  fullNameHi?: string;
  phone: string;
  avatarUrl: string;
  category: ServiceCategorySlug;
  subcategories: string[];
  experienceYears: number;
  city: string;
  locality: string;
  serviceRadiusKm: number;
  languages: string[];
  isAvailableToday: boolean;
  availabilitySchedule: {
    days: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    timeSlots: string[]; // e.g. ["Morning (8am-12pm)", "Afternoon (12pm-4pm)", "Evening (4pm-8pm)"]
  };
  pricingBasis: PricingBasis;
  baseRate: number;
  rateCards: RateCard[];
  bio: string;
  bioHi?: string;
  verificationStatus: VerificationStatus;
  verificationDetails: {
    isIdentityVerified: boolean; // Phone & address check
    isBackgroundChecked: boolean;
    isSkillEndorsed: boolean;
    verificationDate?: string;
  };
  rating: number; // calculated from real completed reviews only
  reviewCount: number;
  completedJobsCount: number;
  onTimeArrivalRatePercent: number;
  isDemoProfile: boolean;
  proofOfWorkExamples?: {
    id: string;
    title: string;
    description: string;
    beforePhoto?: string;
    afterPhoto?: string;
    completedDate: string;
  }[];
}

export type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'expired';

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  workerCategory: ServiceCategorySlug;
  workerAvatar: string;
  workerPhone: string;
  status: BookingStatus;
  statusHistory: {
    status: BookingStatus;
    timestamp: string;
    note?: string;
  }[];
  serviceTitle: string;
  serviceCategory: ServiceCategorySlug;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeSlot: string; // e.g. "10:00 AM - 12:00 PM"
  customerAddress: {
    houseNumber: string;
    locality: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  jobDescription: string;
  pricingBasis: PricingBasis;
  agreedPrice: number;
  paymentMethod: 'cash_on_completion' | 'upi_direct' | 'pending';
  paymentStatus: 'pending' | 'paid_directly_to_worker' | 'refunded';
  proofOfWorkNotes?: string;
  proofOfWorkPhotos?: string[];
  createdAt: string;
  updatedAt: string;
  cancelledBy?: 'customer' | 'worker' | 'admin';
  cancellationReason?: string;
  hasReview: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  customerLocality: string;
  rating: number; // 1 to 5
  punctualityRating: number;
  workQualityRating: number;
  politenessRating: number;
  comment: string;
  createdAt: string;
  isVerifiedJob: boolean;
}

export type ComplaintStatus = 'open' | 'under_investigation' | 'resolved' | 'dismissed';

export interface Complaint {
  id: string;
  ticketNumber: string;
  bookingId?: string;
  raisedByUserId: string;
  raisedByRole: UserRole;
  raisedByName: string;
  raisedByPhone: string;
  accusedWorkerOrCustomerId?: string;
  accusedName?: string;
  category: 'unprofessional_behavior' | 'billing_dispute' | 'no_show' | 'poor_work_quality' | 'safety_concern' | 'other';
  subject: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'worker' | 'booking' | 'complaint' | 'category' | 'user';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  locality: string;
  city: string;
  workerProfileId?: string;
}
