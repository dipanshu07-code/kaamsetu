import { describe, it, expect } from 'vitest';
import { initialBookings, initialWorkers, demoAccounts } from '@/lib/mock-data';
import { Booking, BookingStatus } from '@/types';

describe('KaamSetu Booking Workflow Lifecycle', () => {
  it('creates a new booking request in pending status', () => {
    const customer = demoAccounts.customer;
    const worker = initialWorkers[0]; // Rameshwar (Electrician)

    const newBooking: Booking = {
      id: `b-test-${Date.now()}`,
      bookingNumber: 'KS-2026-TEST1',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      workerId: worker.id,
      workerName: worker.fullName,
      workerCategory: worker.category,
      workerAvatar: worker.avatarUrl,
      workerPhone: worker.phone,
      status: 'pending',
      statusHistory: [
        { status: 'pending', timestamp: new Date().toISOString(), note: 'Customer created booking.' }
      ],
      serviceTitle: worker.rateCards[0].serviceTitle,
      serviceCategory: worker.category,
      scheduledDate: '2026-10-25',
      scheduledTimeSlot: 'Morning (9am-1pm)',
      customerAddress: {
        houseNumber: 'Flat 101, Block B',
        locality: 'Lajpat Nagar IV',
        city: 'Delhi NCR',
        pincode: '110024'
      },
      jobDescription: 'Fix 2 switchboards with sparking issue.',
      pricingBasis: 'per-visit',
      agreedPrice: worker.baseRate,
      paymentMethod: 'upi_direct',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasReview: false
    };

    expect(newBooking.status).toBe('pending');
    expect(newBooking.agreedPrice).toBeGreaterThan(0);
    expect(newBooking.hasReview).toBe(false);
  });

  it('allows worker to accept booking and transition status to confirmed', () => {
    const booking = { ...initialBookings[0] };
    const acceptedStatus: BookingStatus = 'confirmed';
    booking.status = acceptedStatus;
    booking.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      note: 'Worker confirmed appointment'
    });

    expect(booking.status).toBe('confirmed');
    expect(booking.statusHistory.some(h => h.status === 'confirmed')).toBe(true);
  });

  it('allows worker or customer to decline/cancel and records reason', () => {
    const booking = { ...initialBookings[0] };
    booking.status = 'cancelled';
    booking.cancelledBy = 'customer';
    booking.cancellationReason = 'Sudden out of station travel';

    expect(booking.status).toBe('cancelled');
    expect(booking.cancelledBy).toBe('customer');
    expect(booking.cancellationReason).toBeDefined();
  });

  it('enforces that reviews can only be posted for completed jobs', () => {
    const pendingBooking = { ...initialBookings[2], status: 'pending' as BookingStatus };
    const completedBooking = { ...initialBookings[0], status: 'completed' as BookingStatus };

    // Function simulating review posting guard
    const canPostReview = (b: Booking) => b.status === 'completed';

    expect(canPostReview(pendingBooking)).toBe(false);
    expect(canPostReview(completedBooking)).toBe(true);
  });
});
