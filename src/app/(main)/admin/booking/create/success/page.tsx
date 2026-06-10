'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ListChecks, LayoutGrid, Loader2 } from 'lucide-react';

function SuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-md text-center">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Created Successfully!</h1>
        <p className="text-gray-500 text-sm mb-6">
          The booking has been created and all parties have been notified.
        </p>

        {/* Booking ID */}
        {bookingId && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Booking ID</p>
            <p className="text-sm font-mono font-semibold text-gray-800 break-all">{bookingId}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/admin/booking')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
          >
            <ListChecks className="w-4 h-4" />
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/admin/gallery')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Back to Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
