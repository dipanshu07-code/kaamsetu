'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ServiceCategorySlug, PricingBasis } from '@/types';
import { 
  HardHat, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Phone,
  User,
  MapPin,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function WorkerRegisterPage() {
  const router = useRouter();
  const { categories, registerWorker, loginUser } = useAppStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<ServiceCategorySlug>('electrician');
  const [experienceYears, setExperienceYears] = useState<number>(4);
  const [city, setCity] = useState('Delhi NCR');
  const [locality, setLocality] = useState('');
  const [languages, setLanguages] = useState('Hindi, English');
  const [pricingBasis, setPricingBasis] = useState<PricingBasis>('per-visit');
  const [baseRate, setBaseRate] = useState<number>(299);
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phone.trim() || !locality.trim() || !bio.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const languageArray = languages.split(',').map((l) => l.trim()).filter(Boolean);

      const newProfile = registerWorker({
        userId: `u-worker-${Date.now()}`,
        fullName,
        phone,
        avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        category,
        subcategories: [category.replace('-', ' ')],
        experienceYears: Number(experienceYears),
        city,
        locality,
        serviceRadiusKm: 8,
        languages: languageArray.length ? languageArray : ['Hindi'],
        isAvailableToday: true,
        availabilitySchedule: {
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          timeSlots: ['Morning (9am-1pm)', 'Afternoon (2pm-6pm)']
        },
        pricingBasis,
        baseRate: Number(baseRate),
        rateCards: [
          {
            id: `rc-${Date.now()}-1`,
            serviceCategorySlug: category,
            serviceTitle: `Standard ${category.replace('-', ' ')} Service`,
            pricingBasis,
            amount: Number(baseRate),
            description: `General residential inspection and repair. Diagnostic tools included.`
          }
        ],
        bio,
        verificationDetails: {
          isIdentityVerified: true,
          isBackgroundChecked: false,
          isSkillEndorsed: false
        }
      });

      // Login as this new worker
      loginUser({
        id: newProfile.userId,
        name: newProfile.fullName,
        phone: newProfile.phone,
        role: 'worker',
        locality: newProfile.locality,
        city: newProfile.city,
        workerProfileId: newProfile.id
      });

      setIsSubmitting(false);
      router.push('/worker/dashboard');
    } catch (err) {
      setIsSubmitting(false);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <HardHat className="w-3.5 h-3.5 text-teal-600" />
            <span>Worker Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Join KaamSetu as a Service Worker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build your digital reputation, connect with nearby households, and retain 100% of your earnings.
          </p>
        </div>

        {/* Privacy & Trust Notice */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold">Privacy First Onboarding:</strong>
            <p className="text-blue-800 leading-relaxed">
              KaamSetu does not ask for your Aadhaar card number, bank passwords, or confidential documents. 
              We only collect the operational information needed for customers to discover and contact you.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rameshwar Prasad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mobile Number (For Job Requests) *
              </label>
              <input
                type="tel"
                placeholder="e.g. 9810123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>
          </div>

          {/* Trade Category & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Primary Trade Category *
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800 bg-white"
              >
                {categories
                  .filter((c) => c.isEnabled)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Years of Work Experience *
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                required
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Operating Locality / Sector *
              </label>
              <input
                type="text"
                placeholder="e.g. Lajpat Nagar, Koramangala, Kothrud"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                required
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                City / Region *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800 bg-white"
              >
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>
          </div>

          {/* Languages & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Languages Spoken
              </label>
              <input
                type="text"
                placeholder="e.g. Hindi, English"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pricing Model *
              </label>
              <select
                value={pricingBasis}
                onChange={(e: any) => setPricingBasis(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800 bg-white"
              >
                <option value="per-visit">Per Visit / Inspection</option>
                <option value="per-hour">Hourly Job</option>
                <option value="per-day">Per Day Shift</option>
                <option value="per-month">Monthly Domestic Service</option>
                <option value="quoted">Quoted Basis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Starting Rate (₹) *
              </label>
              <input
                type="number"
                min={100}
                max={50000}
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                required
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Short Professional Introduction *
            </label>
            <textarea
              rows={3}
              placeholder="Tell customers about your skills, tools you bring, types of appliances or chores you specialize in..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 focus:border-brand-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Profile...' : 'Create Worker Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
