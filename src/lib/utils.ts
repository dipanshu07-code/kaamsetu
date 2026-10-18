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

// Translations for dual-language support (English & Hindi)
export const dictionary = {
  en: {
    brandName: "KaamSetu",
    tagline: "Connecting Local Workers with Trusted Opportunities.",
    navFindWorkers: "Find Workers",
    navBecomeWorker: "Become a Worker",
    navHowItWorks: "How It Works",
    navAbout: "About Us",
    navLogin: "Login",
    navDashboard: "Dashboard",
    heroTitle: "Find Trusted Local Workers. Build Better Opportunities.",
    heroSubtitle: "Find household help and skilled professionals near you, compare service details, and request bookings with greater transparency.",
    searchPlaceholder: "Search by service (e.g. Electrician, Cook, Maid)...",
    localityPlaceholder: "Select or type locality (e.g. Lajpat Nagar, Koramangala)...",
    searchBtn: "Search Workers",
    categoriesHeading: "Essential Local Services",
    categoriesSubheading: "Transparent rate benchmarks, verified local workers, and no hidden commission fees.",
    howItWorksHeading: "How KaamSetu Works",
    forCustomers: "For Customers",
    forWorkers: "For Workers",
    trustHeading: "Transparent & Accountable Marketplace",
    trustSub: "We prioritize genuine verification, transparent pricing, and zero fake guarantees.",
    demoBadge: "Demo Platform Data",
    viewProfile: "View Digital Passport",
    requestBooking: "Request Booking",
  },
  hi: {
    brandName: "कामसेतु",
    tagline: "स्थानीय कारीगरों और परिवारों के बीच भरोसेमंद सेतु।",
    navFindWorkers: "कारीगर खोजें",
    navBecomeWorker: "कामगार बनें",
    navHowItWorks: "यह कैसे काम करता है",
    navAbout: "हमारे बारे में",
    navLogin: "लॉग इन",
    navDashboard: "डैशबोर्ड",
    heroTitle: "भरोसेमंद स्थानीय कामगार खोजें। नए अवसर बनाएं।",
    heroSubtitle: "अपने आस-पास घरेलू सहायकों और कुशल कारीगरों को खोजें, सेवा विवरणों की तुलना करें और पारदर्शी तरीके से बुकिंग का अनुरोध करें।",
    searchPlaceholder: "सेवा खोजें (जैसे: इलेक्ट्रीशियन, रसोइया, मेड)...",
    localityPlaceholder: "इलाका चुनें (जैसे: लाजपत नगर, कोरामंगला)...",
    searchBtn: "कामगार खोजें",
    categoriesHeading: "प्रमुख स्थानीय सेवाएं",
    categoriesSubheading: "पारदर्शी दरें, सत्यापित स्थानीय कामगार और कोई छिपे शुल्क नहीं।",
    howItWorksHeading: "कामसेतु कैसे काम करता है",
    forCustomers: "ग्राहकों के लिए",
    forWorkers: "कामगारों के लिए",
    trustHeading: "पारदर्शी और जवाबदेह मंच",
    trustSub: "हम वास्तविक सत्यापन, स्पष्ट दरों और बिना किसी झूठे वादों पर विश्वास करते हैं।",
    demoBadge: "डेमो प्लेटफ़ॉर्म डेटा",
    viewProfile: "डिजिटल पासपोर्ट देखें",
    requestBooking: "बुकिंग अनुरोध करें",
  }
};
