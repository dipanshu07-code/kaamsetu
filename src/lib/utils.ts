import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIndianPhone(phone: string): string {
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getEstimatedPriceRange(categorySlug: string): { min: number; max: number; basis: string; disclaimer: string } {
  switch (categorySlug) {
    case 'maid-housekeeping':
      return {
        min: 350,
        max: 800,
        basis: 'per-visit (or ₹2,500 - ₹5,000 / month)',
        disclaimer: 'Based on prevailing market rates in standard metropolitan residential localities. Final price depends on house BHK size and scope of chores.',
      };
    case 'cook':
      return {
        min: 400,
        max: 900,
        basis: 'per-meal / day (or ₹3,500 - ₹7,500 / month)',
        disclaimer: 'Estimates vary based on family size, number of meals, and dietary complexity.',
      };
    case 'electrician':
      return {
        min: 250,
        max: 650,
        basis: 'visiting fee + per-point fitting',
        disclaimer: 'Materials/spare parts charged separately as per actual purchase receipts.',
      };
    case 'plumber':
      return {
        min: 300,
        max: 750,
        basis: 'visiting fee + repair complexity',
        disclaimer: 'Major pipe work or concealed leakages require on-site diagnostic quotation.',
      };
    case 'carpenter':
      return {
        min: 350,
        max: 850,
        basis: 'visiting inspection / hourly job',
        disclaimer: 'Hardware fittings, timber, and laminates billed directly at market price.',
      };
    case 'general-labour':
      return {
        min: 600,
        max: 950,
        basis: 'per day (8 hours shift)',
        disclaimer: 'Aligned with state minimum wage benchmarks and daylight operating hours.',
      };
    case 'shifting-assistant':
      return {
        min: 800,
        max: 2000,
        basis: 'per move (2-4 hours assistance)',
        disclaimer: 'Vehicle transport not included unless specifically arranged in booking notes.',
      };
    default:
      return {
        min: 300,
        max: 800,
        basis: 'per visit',
        disclaimer: 'Rates subject to mutual discussion and confirmation prior to work commencement.',
      };
  }
}
