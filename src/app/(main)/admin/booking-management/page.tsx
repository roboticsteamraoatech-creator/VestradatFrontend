"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/AuthContext';
import {
  Calendar, Search, RefreshCw, Loader2, User, Clock,
  MapPin, Tag, CheckCircle, ChevronRight, Users, DollarSign, XCircle
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

type BookingStatus = 'all' | 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled';

interface Customer { name?: string; email?: string; phone?: string; customUserId?: string; }
interface Location { type?: string; address?: string; }
interface Booking {
  bookingId: string;
  taskId?: string;
  serviceName?: string;
  customer?: Customer;
  bookingDate?: string;
  bookingTime?: string;
  duration?: number;
  totalPersons?: number;
  totalAmount?: number;
  amountPaid?: number;
  bookingStatus?: string;
  orderStatus?: string;
  paymentStatus?: string;
  location?: Location;
  assignedProviders?: Array<{ name?: string; email?: string }>;
  bookedByAdmin?: boolean;
  bookedForPersons?: any[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled:    { bg: 'bg-blue-100',   text: 'text-blue-700' },
  confirmed:    { bg: 'bg-green-100',  text: 'text-green-700' },
  pending:      { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed:    { bg: 'bg-teal-100',   text: 'text-teal-700' },
  cancelled:    { bg: 'bg-red-100',    text: 'text-red-700' },
  rescheduled:  { bg: 'bg-purple-100', text: 'text-purple-700' },
};

const PAYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  paid:    { bg: 'bg-green-100',  text: 'text-green-700' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  failed:  { bg: 'bg-red-100',    text: 'text-red-700' },
};

const LOCATION_LABELS: Record<string, string> = {
  merchant_location: 'Our Location',
  customer_address:  'Customer Address',
  new_address:       'New Address',
  whatsapp_location: 'WhatsApp Location',
};

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'scheduled',    label: 'Scheduled' },
  { key: 'confirmed',    label: 'Confirmed' },
  { key: 'pending',      label: 'Pending' },
  { key: 'completed',    label: 'Completed' },
  { key: 'cancelled',    label: 'Cancelled' },
  { key: 'rescheduled',  label: 'Rescheduled' },
];

const fmt = (n?: number) =>
  n != null ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n) : '—';

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

export default function BookingManagementPage() {
  const { token } = useAuthContext();
  const [activeTab, setActiveTab] = useState<BookingStatus>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

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
      // Handle response: { success, data: { bookings, pagination }, total }
      const list = data.data?.bookings || data.bookings || [];
      const pag = data.data?.pagination || data.pagination || {};
      setBookings(list);
      setTotal(data.total || pag.total || list.length);
      setTotalPages(pag.totalPages || data.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, selectedDate]);

  useEffect(() => { setPage(1); fetchBookings(1); }, [activeTab, selectedDate]);
  useEffect(() => { if (page > 1) fetchBookings(page); }, [page]);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.serviceName || '').toLowerCase().includes(q) ||
      (b.customer?.name || '').toLowerCase().includes(q) ||
      (b.customer?.email || '').toLowerCase().includes(q) ||
      (b.bookingId || '').toLowerCase().includes(q)
    );
  });

  const handleMarkCompleted = async () => {
    if (!selected) return;
    setCompleting(true);
    setCompleteError('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/bookings/${selected.bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setSelected(null);
      fetchBookings(page);
    } catch (err: any) {
      setCompleteError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const getStyle = (status?: string) => STATUS_COLORS[status?.toLowerCase() || ''] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const getPayStyle = (status?: string) => PAYMENT_COLORS[status?.toLowerCase() || ''] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all service bookings · {total} total</p>
        </div>
        <button
          onClick={() => fetchBookings(page)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search + Date */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, service, or booking ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
          {selectedDate && (
            <button onClick={() => setSelectedDate('')} className="text-xs text-red-500 hover:underline whitespace-nowrap">Clear</button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              activeTab === tab.key ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading bookings…</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => fetchBookings(page)} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No bookings found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const s = getStyle(b.bookingStatus);
            const ps = getPayStyle(b.paymentStatus);
            const locLabel = LOCATION_LABELS[b.location?.type || ''] || b.location?.type || '—';
            return (
              <button
                key={b.bookingId}
                onClick={() => setSelected(b)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900 text-sm">{b.serviceName || 'Service'}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                        {b.bookingStatus || '—'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.bookedByAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {b.bookedByAdmin ? 'Admin' : 'Customer'}
                      </span>
                      {b.paymentStatus && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ps.bg} ${ps.text}`}>
                          {b.paymentStatus}
                        </span>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 shrink-0" />
                        <span className="font-mono truncate">{b.bookingId.slice(-10)}</span>
                      </div>
                      {b.customer?.name && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="text-purple-600 font-medium truncate">{b.customer.name}</span>
                        </div>
                      )}
                      {(b.bookingDate || b.bookingTime) && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{fmtDate(b.bookingDate)}{b.bookingTime ? ` · ${b.bookingTime}` : ''}</span>
                        </div>
                      )}
                      {b.totalPersons != null && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 shrink-0" />
                          <span>{b.totalPersons} person{b.totalPersons !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {b.totalAmount != null && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 shrink-0" />
                          <span>{fmt(b.totalAmount)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{locLabel}</span>
                      </div>
                    </div>

                    {/* Assigned providers */}
                    {b.assignedProviders && b.assignedProviders.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        Provider: {b.assignedProviders.map(p => p.name || p.email).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1001]"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-1 text-sm">
              {[
                ['Booking ID', selected.bookingId],
                ['Service', selected.serviceName],
                ['Customer', selected.customer?.name],
                ['Email', selected.customer?.email],
                ['Phone', selected.customer?.phone],
                ['Date', fmtDate(selected.bookingDate)],
                ['Time', selected.bookingTime],
                ['Duration', selected.duration ? `${selected.duration} min` : undefined],
                ['Total Persons', selected.totalPersons != null ? String(selected.totalPersons) : undefined],
                ['Total Amount', selected.totalAmount != null ? fmt(selected.totalAmount) : undefined],
                ['Amount Paid', selected.amountPaid != null ? fmt(selected.amountPaid) : undefined],
                ['Booking Status', selected.bookingStatus],
                ['Order Status', selected.orderStatus],
                ['Payment Status', selected.paymentStatus],
                ['Location Type', LOCATION_LABELS[selected.location?.type || ''] || selected.location?.type],
                ['Location Address', selected.location?.address],
                ['Booked By Admin', selected.bookedByAdmin ? 'Yes' : 'No'],
                ['Task ID', selected.taskId],
                ['Assigned Providers', selected.assignedProviders?.map(p => p.name || p.email).filter(Boolean).join(', ')],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">{label}</span>
                  <span className="text-gray-900 text-right max-w-[55%]">{value as string}</span>
                </div>
              ))}
            </div>

            {/* Modal footer — Mark Completed only when confirmed */}
            <div className="p-5 border-t border-gray-100 space-y-2">
              {completeError && (
                <p className="text-xs text-red-600 text-center">{completeError}</p>
              )}
              {selected.bookingStatus === 'confirmed' && (
                <button
                  onClick={handleMarkCompleted}
                  disabled={completing}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {completing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Marking…</>
                    : <><CheckCircle className="w-4 h-4" /> Mark as Completed</>
                  }
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
