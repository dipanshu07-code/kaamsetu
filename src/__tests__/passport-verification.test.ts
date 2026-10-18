import { describe, it, expect } from 'vitest';
import { initialWorkers, initialComplaints, initialAuditLogs } from '@/lib/mock-data';

describe('Digital Work Passport & Administrative Governance', () => {
  it('strictly distinguishes verified badges from self-reported data', () => {
    const verifiedWorker = initialWorkers.find((w) => w.verificationStatus === 'verified');
    const pendingWorker = initialWorkers.find((w) => w.verificationStatus === 'pending');

    expect(verifiedWorker).toBeDefined();
    expect(verifiedWorker?.verificationDetails.isIdentityVerified).toBe(true);

    expect(pendingWorker).toBeDefined();
    expect(pendingWorker?.verificationDetails.isBackgroundChecked).toBe(false);
  });

  it('calculates ratings from authentic job reviews', () => {
    const worker = initialWorkers[0];
    expect(worker.rating).toBeGreaterThanOrEqual(1.0);
    expect(worker.rating).toBeLessThanOrEqual(5.0);
    expect(worker.completedJobsCount).toBeGreaterThanOrEqual(worker.reviewCount);
  });

  it('records grievance tickets with trackable reference numbers', () => {
    const ticket = initialComplaints[0];
    expect(ticket.ticketNumber).toMatch(/^TKT-\d{4}-\d+/);
    expect(ticket.category).toBeDefined();
    expect(ticket.status).toBe('resolved');
    expect(ticket.resolutionNotes).toBeDefined();
  });

  it('maintains transparent audit logs for administrative interventions', () => {
    expect(initialAuditLogs.length).toBeGreaterThan(0);
    const log = initialAuditLogs[0];
    expect(log.action).toContain('WORKER_VERIFICATION');
    expect(log.details).toBeDefined();
    expect(log.timestamp).toBeDefined();
  });
});
