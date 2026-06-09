"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react';
import { toast } from '@/app/components/hooks/use-toast';

import { BASE_URL } from '@/config/api';

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken')
    : null;

const BOOKING_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'] as const;
type BookingStatus = typeof BOOKING_STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
};

const fmtDate = (d?: string) => {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return 'N/A'; }
};

interface Booking {
  _id: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  serviceName?: string;
  productName?: string;
  bookingDate?: string;
  scheduledDate?: string;
  bookingTime?: string;
  scheduledTime?: string;
  status?: string;
  createdAt?: string;
}

interface ModalState {
  booking: Booking;
  status: BookingStatus;
  newDate: string;
  newTime: string;
  loading: boolean;
}

const ServiceBookingsPage = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => { fetchBookings(); }, [dateFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const qs = dateFilter ? `?date=${dateFilter}` : '';
      const res = await fetch(`${BASE_URL}/api/orders/admin/service-bookings${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();
      if (result.success) {
        setBookings(Array.isArray(result.data?.bookings) ? result.data.bookings : []);
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to load bookings', variant: 'destructive' });
        setBookings([]);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to connect', variant: 'destructive' });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (booking: Booking) => {
    setModal({ booking, status: 'scheduled', newDate: '', newTime: '', loading: false });
  };

  const updateStatus = async () => {
    if (!modal) return;
    setModal(m => m ? { ...m, loading: true } : m);
    try {
      const body: Record<string, string> = { status: modal.status };
      if (modal.status === 'rescheduled') {
        body.newDate = modal.newDate;
        body.newTime = modal.newTime;
      }
      const orderId = modal.booking.orderId || modal.booking._id;
      const res = await fetch(`${BASE_URL}/api/orders/admin/${orderId}/booking-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Booking status updated successfully' });
        setModal(null);
        fetchBookings();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to update status', variant: 'destructive' });
        setModal(m => m ? { ...m, loading: false } : m);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to connect', variant: 'destructive' });
      setModal(m => m ? { ...m, loading: false } : m);
    }
  };

  const canSubmit =
    modal &&
    modal.status &&
    (modal.status !== 'rescheduled' || (!!modal.newDate && !!modal.newTime));

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8">
        <button
          onClick={() => router.push('/admin/order-management')}
          className="flex items-center gap-2 text-sm text-gray-600 mb-6 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Bookings</h1>
            <p className="text-gray-600 text-sm mt-1">Manage and update service booking appointments</p>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-[#5D2A8B] text-white rounded-lg text-sm hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-600">Filter by date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Bookings table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600" />
              <span className="text-gray-500 text-sm">Loading bookings...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">
                No bookings found{dateFilter ? ' for the selected date' : ''}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Booking ID', 'Customer', 'Service', 'Scheduled', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        #{(b.orderId || b._id).slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{b.customerName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{b.customerEmail || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {b.serviceName || b.productName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p>{fmtDate(b.bookingDate || b.scheduledDate)}</p>
                        {(b.bookingTime || b.scheduledTime) && (
                          <p className="text-xs text-gray-500">{b.bookingTime || b.scheduledTime}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status || ''] || 'bg-gray-100 text-gray-700'}`}>
                          {b.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal(b)}
                          className="text-xs text-[#5D2A8B] hover:underline font-medium"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status update modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => !modal.loading && setModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">Update Booking Status</h2>
            <p className="text-sm text-gray-500 mb-5">
              #{(modal.booking.orderId || modal.booking._id).slice(-8).toUpperCase()}
              {modal.booking.customerName ? ` — ${modal.booking.customerName}` : ''}
            </p>

            <p className="text-sm font-medium text-gray-700 mb-2">New status</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {BOOKING_STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setModal(m => m ? { ...m, status: s } : m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
                    modal.status === s
                      ? 'bg-[#5D2A8B] text-white border-[#5D2A8B]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {modal.status === 'rescheduled' && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={modal.newDate}
                    onChange={e => setModal(m => m ? { ...m, newDate: e.target.value } : m)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={modal.newTime}
                    onChange={e => setModal(m => m ? { ...m, newTime: e.target.value } : m)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={updateStatus}
                disabled={modal.loading || !canSubmit}
                className="flex-1 px-4 py-2 bg-[#5D2A8B] text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {modal.loading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setModal(null)}
                disabled={modal.loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookingsPage;
