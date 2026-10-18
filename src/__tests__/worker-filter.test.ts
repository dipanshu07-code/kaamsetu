import { describe, it, expect } from 'vitest';
import { initialWorkers, serviceCategories } from '@/lib/mock-data';
import { getEstimatedPriceRange, formatINR } from '@/lib/utils';

describe('Worker Search, Faceting & Price Intelligence', () => {
  it('filters workers by category accurately', () => {
    const electricians = initialWorkers.filter((w) => w.category === 'electrician');
    expect(electricians.length).toBeGreaterThan(0);
    expect(electricians.every((w) => w.category === 'electrician')).toBe(true);
  });

  it('filters workers by locality and city', () => {
    const southDelhiWorkers = initialWorkers.filter((w) => 
      w.locality.toLowerCase().includes('lajpat nagar')
    );
    expect(southDelhiWorkers.length).toBeGreaterThan(0);
    expect(southDelhiWorkers[0].city).toBe('Delhi NCR');
  });

  it('filters by availability today toggle', () => {
    const availableToday = initialWorkers.filter((w) => w.isAvailableToday);
    expect(availableToday.every((w) => w.isAvailableToday === true)).toBe(true);
  });

  it('provides honest price intelligence benchmarks for each service category', () => {
    const electricianRange = getEstimatedPriceRange('electrician');
    expect(electricianRange.min).toBeGreaterThan(0);
    expect(electricianRange.max).toBeGreaterThan(electricianRange.min);
    expect(electricianRange.disclaimer).toContain('spare parts');

    const cookRange = getEstimatedPriceRange('cook');
    expect(cookRange.min).toBeGreaterThan(0);
    expect(cookRange.max).toBeGreaterThan(cookRange.min);
  });

  it('enforces safeguarding policy: childcare category must be disabled in platform pilot', () => {
    const childcare = serviceCategories.find((c) => c.slug === 'childcare');
    expect(childcare).toBeDefined();
    expect(childcare?.isEnabled).toBe(false);
    expect(childcare?.disabledReason).toBeDefined();
    expect(childcare?.disabledReason?.toLowerCase()).toContain('safety');
  });

  it('formats Indian Rupees currency with ₹ symbol and commas', () => {
    expect(formatINR(350)).toContain('350');
    expect(formatINR(5000)).toContain('5,000');
  });
});
