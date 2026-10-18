'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { demoAccounts } from '@/lib/mock-data';
import { 
  Phone, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  HardHat, 
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, switchRole } = useAppStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456' && otp.length < 4) {
      setError('Please enter the 6-digit OTP (Use Demo OTP: 123456)');
      return;
    }

    loginUser({
      id: `u-${Date.now()}`,
      name: 'Logged-In User',
      phone,
      role: 'customer',
      locality: 'Lajpat Nagar',
      city: 'Delhi NCR'
    });

    router.push('/customer/dashboard');
  };

  const handleQuickDemoLogin = (role: 'customer' | 'worker' | 'admin') => {
    switchRole(role);
    if (role === 'worker') router.push('/worker/dashboard');
    else if (role === 'admin') router.push('/admin');
    else router.push('/customer/dashboard');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-900 text-teal-300 font-black text-xl flex items-center justify-center mx-auto shadow-md">
            KS
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Sign In to KaamSetu
          </h1>
          <p className="text-xs text-slate-500">
            Access your bookings, profile, or worker dashboard
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
            ⚡ Quick Evaluation: 1-Click Role Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('customer')}
              className="py-2 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
            >
              <User className="w-4 h-4 text-blue-700" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('worker')}
              className="py-2 px-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
            >
              <HardHat className="w-4 h-4 text-teal-700" />
              <span>Worker</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('admin')}
              className="py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
            Or sign in with mobile OTP
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Indian Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98101 23456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl pl-12 pr-4 py-2.5 focus:border-brand-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Send OTP Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
              OTP sent to +91 {phone}. <strong>(Use Demo Code: 123456)</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full text-center tracking-widest text-base font-bold border border-slate-300 rounded-xl py-2.5 focus:border-brand-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Verify OTP & Sign In
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-slate-500 hover:underline"
            >
              ← Change Mobile Number
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-xs text-slate-500">
          Want to offer your services?{' '}
          <Link href="/worker/register" className="font-bold text-teal-700 hover:underline">
            Register as a Worker
          </Link>
        </div>
      </div>
    </div>
  );
}
