"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Package, MapPin, ArrowRight } from 'lucide-react';
import { BASE_URL } from '@/config/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

function CombinedPaymentVerificationComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment…');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txRef = urlParams.get('tx_ref') || searchParams.get('tx_ref');
    const status = urlParams.get('status') || searchParams.get('status');

    if (!txRef) {
      setState('failed');
      setMessage('No transaction reference found in the URL.');
      return;
    }

    if (status !== 'successful' && status !== 'success') {
      setState('failed');
      setMessage(status === 'cancelled' ? 'Payment was cancelled. Please try again.' : 'Payment was not completed successfully.');
      return;
    }

    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    if (!token) {
      setState('failed');
      setMessage('Session expired. Redirecting to login…');
      setTimeout(() => {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        router.push('/auth/login');
      }, 2000);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/payment/combined/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tx_ref: txRef }),
        });
        const json = await res.json();

        if (json.success) {
          setState('success');
          setData(json.data);
          setMessage('Payment confirmed! Your subscription is now active and your location is pending admin verification.');
          setTimeout(() => router.push('/admin/subscription'), 4000);
        } else {
          setState('failed');
          setMessage(json.message || 'Payment verification failed. Please contact support.');
        }
      } catch (err: any) {
        setState('failed');
        setMessage(err.message || 'An error occurred while verifying your payment.');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Status header */}
        <div className={`px-6 pt-8 pb-6 text-center ${state === 'success' ? 'bg-green-50' : state === 'failed' ? 'bg-red-50' : 'bg-purple-50'}`}>
          {state === 'verifying' && (
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          )}
          {state === 'success' && (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
          {state === 'failed' && (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          )}

          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {state === 'verifying' && 'Verifying Payment…'}
            {state === 'success' && 'Payment Successful!'}
            {state === 'failed' && 'Payment Failed'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        {/* Success detail */}
        {state === 'success' && data && (
          <div className="px-6 py-5 space-y-3 border-t border-gray-100">
            {data.totalAmountPaid && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-semibold text-gray-800">{fmt(data.totalAmountPaid)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-xl text-sm text-green-700">
              <Package className="w-4 h-4 shrink-0" />
              <span>Subscription <strong>activated</strong></span>
            </div>
            <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 rounded-xl text-sm text-amber-700">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Location <strong>pending admin verification</strong></span>
            </div>
            <p className="text-xs text-center text-gray-400 pt-1">Redirecting to your subscription page…</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          {state === 'success' && (
            <button onClick={() => router.push('/admin/subscription')}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 flex items-center justify-center gap-2">
              Go to Subscription <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {state === 'failed' && (
            <>
              <button onClick={() => router.push('/admin/subscription/upgrade')}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700">
                Try Again
              </button>
              <button onClick={() => router.push('/admin')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200">
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CombinedPaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <CombinedPaymentVerificationComponent />
    </Suspense>
  );
}
