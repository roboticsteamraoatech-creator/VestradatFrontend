"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { BASE_URL } from '@/config/api';

export default function ResetPasswordOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(600);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load otpData from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('resetOtpData');
      if (raw) {
        const otpData = JSON.parse(raw);
        setCountdown(otpData.otpExpiresIn ?? 600);
      }
    } catch {}
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    if (countdown === 0) {
      setError('OTP has expired. Please request a new one.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      setSuccess('OTP verified! Redirecting...');
      // Navigate to set-new-password with email and otp
      setTimeout(() => {
        router.push(`/auth/set-new-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      setCountdown(data.otpExpiresIn ?? 600);
      setDigits(['', '', '', '', '', '']);
      setSuccess('New OTP sent to your email');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Verification Code</h1>
          <p className="text-gray-500 mt-2 text-sm">
            We sent a 6-digit code to<br />
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-purple-600 transition-colors"
              style={{ borderColor: digit ? '#7C3AED' : '#E5E7EB' }}
            />
          ))}
        </div>

        {/* Countdown */}
        <div className="text-center mb-4">
          {countdown > 0 ? (
            <p className="text-sm text-gray-500">
              Code expires in <span className="font-semibold text-purple-600">{formatTime(countdown)}</span>
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">OTP expired. Please request a new one.</p>
          )}
        </div>

        {/* Error / Success */}
        {error && <div className="text-red-600 text-sm text-center mb-3 bg-red-50 p-3 rounded-lg">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center mb-3 bg-green-50 p-3 rounded-lg">{success}</div>}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || digits.join('').length !== 6}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Verifying...
            </>
          ) : 'Verify OTP'}
        </button>

        {/* Resend */}
        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="text-sm font-medium disabled:text-gray-400 text-purple-600 hover:text-purple-800 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? 'Sending...' : "Didn't receive the code? Resend OTP"}
          </button>
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}
