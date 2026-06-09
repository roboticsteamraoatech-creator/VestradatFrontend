"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Calendar, Search, Filter, RefreshCw, Loader2, User, Clock, MapPin, Tag } from 'lucide-react';

import { BASE_URL } from '@/config/api';

type BookingStatus = 'all' | 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled';

interface Booking {
  bookingId: string;
  taskId?: string;
  status: string;
  slotDateTime: string;
  serviceName: string;
  customerName?: string;
  serviceProviderName?: string;
  bookedByAdmin?: boolean;
  bookingSource?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  confirmed:   { bg: 'bg-green-100',  text: 'text-green-700' },
  pending:     { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed:   { bg: 'bg-green-100',  text: 'text-green-700' },
  cancelled:   { bg: 'bg-red-100',    text: 'text-red-700' },
  rescheduled: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rescheduled', label: 'Rescheduled' },
];

export default function BookingManagementPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [activeTab, setActiveTab] = useState<BookingStatus>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [updateModal, setUpdateModal] = useState<{ booking: Booking | null; open: boolean }>({ booking: null, open: false });
  const [updateStatus, setUpdateStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchBookings = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '20' });
      if (activeTab !== 'all') params.set('status', activeTab);
      if (selectedDate) params.set('date', selectedDate);
      const res = await fetch(`${BASE_URL}/api/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load bookings');
      setBookings(data.bookings || []);
      setTotal(data.total || data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, selectedDate]);

  useEffect(() => { setPage(1); fetchBookings(1); }, [activeTab, selectedDate]);
  useEffect(() => { fetchBookings(page); }, [page]);

  const handleUpdateStatus = async () => {
    if (!updateModal.booking || !updateStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/bookings/${updateModal.booking.bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: updateStatus, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setUpdateModal({ booking: null, open: false });
      fetchBookings(page);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dt: string) => {
    try {
      return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return dt; }
  };

  const getStatusStyle = (status: string) => STATUS_COLORS[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
              <p className="text-sm text-gray-500">Manage all service bookings · {total} total</p>
            </div>
          </div>
          <button onClick={() => fetchBookings(page)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
              {selectedDate && (
                <button onClick={() => setSelectedDate('')} className="text-red-500 text-xs hover:underline">Clear</button>
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading bookings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={() => fetchBookings(page)} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(booking => {
              const statusStyle = getStatusStyle(booking.status);
              const isAdminBooked = booking.bookedByAdmin === true;
              return (
                <div key={booking.bookingId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{booking.serviceName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {booking.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isAdminBooked ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {isAdminBooked ? 'Admin Booked' : 'Customer Booked'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="font-mono text-xs">{booking.bookingId}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(booking.slotDateTime)}</span>
                        </div>
                        {booking.customerName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{booking.customerName}</span>
                          </div>
                        )}
                        {booking.serviceProviderName && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{booking.serviceProviderName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setUpdateModal({ booking, open: true }); setUpdateStatus(booking.status); setAdminNotes(''); }}
                        className="px-3 py-1.5 text-sm border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {updateModal.open && updateModal.booking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Update Booking Status</h2>
            <p className="text-sm text-gray-500 mb-4">Booking: <span className="font-mono">{updateModal.booking.bookingId}</span></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                value={updateStatus}
                onChange={e => setUpdateStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Select status</option>
                {['scheduled', 'confirmed', 'pending', 'completed', 'cancelled', 'rescheduled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (optional)</label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Add notes about this status change..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setUpdateModal({ booking: null, open: false })} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateStatus} disabled={updating || !updateStatus} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {updating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...</> : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
