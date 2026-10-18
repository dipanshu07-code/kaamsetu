'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ArrowRight, User, HardHat } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { loginUser } = useAppStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Delhi NCR');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser({
      id: `u-${Date.now()}`,
      name,
      phone,
      role: 'customer',
      locality,
      city,
    });
    router.push('/customer/dashboard');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-teal-300 font-black text-xl flex items-center justify-center mx-auto shadow-md">
            KS
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Create Customer Account
          </h1>
          <p className="text-xs text-slate-500">
            Connect directly with verified local workers near you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Indian Mobile Number
            </label>
            <input
              type="tel"
              placeholder="98123 45678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Locality / Area
              </label>
              <input
                type="text"
                placeholder="Lajpat Nagar"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                required
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-brand-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                City
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
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Create Account & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand-800 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
