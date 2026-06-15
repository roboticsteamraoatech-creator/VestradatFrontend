'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  ArrowLeft, Loader2, ShieldCheck, MapPin, CreditCard, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function VerifiedBadgePaymentPage() {
  const router = useRouter();
  const { token, user } = useAuthContext();

  const [pricing, setPricing] = useState<{ amount: number; totalAmount: number; unpaidLocations: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [checkRes, pricingRes] = await Promise.all([
          fetch(`${BASE_URL}/api/payment/verified-badge/check-payment-required`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BASE_URL}/api/payment/verified-badge/pricing`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const checkData = await checkRes.json();
        const pricingData = await pricingRes.json();

        const p = pricingData.data ?? {};
        setPricing({
          amount: p.amount ?? p.totalAmount ?? 0,
          totalAmount: p.totalAmount ?? p.amount ?? 0,
          unpaidLocations: p.unpaidLocations ?? checkData.data?.unpaidLocations ?? 0,
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handlePay = async () => {
    if (!pricing || pricing.totalAmount === 0) return;
    setPaying(true);
    setError('');
    try {
      const origin = window.location.origin;
      const res = await fetch(`${BASE_URL}/api/payment/verified-badge/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: pricing.totalAmount,
          currency: 'NGN',
          email: user?.email,
          name: user?.fullName || user?.name,
          redirect_url: `${origin}/payment/verify-verified-badge`,
        }),
      });
      const data = await res.json();
      const link = data.data?.paymentLink || data.data?.authorization_url || data.paymentLink || data.authorization_url;
      if (link) {
        window.location.href = link;
      } else {
        throw new Error(data.message || 'No payment link received from server');
      }
    } catch (e: any) {
      setError(e.message || 'Payment initialization failed');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading payment details…</p>
        </div>
      </div>
    );
  }

  const alreadyPaid = !pricing || pricing.totalAmount === 0 || pricing.unpaidLocations === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verified Badge Payment</h1>
            <p className="text-sm text-gray-500">Pay for location verification</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {alreadyPaid ? (
          /* Already paid state */
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">All Paid!</h2>
            <p className="text-sm text-gray-500 mb-6">All your locations have been paid for. Your verified badge is pending admin approval.</p>
            <button
              onClick={() => router.push('/admin/subscription/verification-badge')}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
            >
              View My Locations
            </button>
          </div>
        ) : (
          <>
            {/* Explanation card */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-900">What you're paying for</p>
                <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                  This payment covers verification of your unpaid location{pricing!.unpaidLocations !== 1 ? 's' : ''}. After payment, an admin will review and approve your verified badge.
                </p>
              </div>
            </div>

            {/* Pricing card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold text-gray-800">Payment Breakdown</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Unpaid location{pricing!.unpaidLocations !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-gray-800">{pricing!.unpaidLocations}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-purple-700">{fmt(pricing!.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700">Payments are processed securely by Flutterwave.</p>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-base hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
            >
              {paying
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Flutterwave…</>
                : <><CreditCard className="w-5 h-5" /> Pay {fmt(pricing!.totalAmount)}</>
              }
            </button>

            <p className="text-xs text-center text-gray-400 mt-3">
              You'll be redirected to Flutterwave to complete your payment securely.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
