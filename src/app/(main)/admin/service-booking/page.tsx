"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Search, RefreshCw, Eye, User } from 'lucide-react';
import { toast } from '@/app/components/hooks/use-toast';
import BookingAdminService, { AdminBooking } from '@/services/BookingAdminService';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  accepted: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const ServiceBookingPage = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, [currentPage, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const response = await BookingAdminService.getAdminBookings(currentPage, 20, status);
      if (response.success) {
        // Filter to service type only
        const serviceBookings = (response.data.bookings || []).filter(
          (b) => !b.itemType || b.itemType === 'service'
        );
        setBookings(serviceBookings);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to load bookings', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to connect to server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (b.serviceName || '').toLowerCase().includes(q) ||
      (b.customer?.name || '').toLowerCase().includes(q) ||
      (b.customer?.email || '').toLowerCase().includes(q) ||
      (b.bookingId || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="pt-8 p-4 md:p-8 min-h-screen">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Bookings</h1>
            <p className="text-gray-600 mt-1">View and manage all service bookings</p>
          </div>
          <button
            onClick={loadBookings}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: bookings.length, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Pending', value: bookings.filter(b => b.bookingStatus === 'pending').length, cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Confirmed', value: bookings.filter(b => b.bookingStatus === 'confirmed').length, cls: 'bg-purple-50 border-purple-200 text-purple-700' },
            { label: 'Completed', value: bookings.filter(b => b.bookingStatus === 'completed').length, cls: 'bg-green-50 border-green-200 text-green-700' },
          ].map(card => (
            <div key={card.label} className={`p-4 rounded-xl border ${card.cls}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by service, customer, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Booking ID', 'Service', 'Customer', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No service bookings found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {(booking.bookingId || booking._id || '').slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{booking.serviceName || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{booking.customer?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{booking.customer?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {booking.bookingDate ? formatDate(booking.bookingDate) : 'N/A'}
                        {booking.bookingTime && <span className="block text-xs">{booking.bookingTime}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.bookingStatus || ''] || 'bg-gray-100 text-gray-700'}`}>
                          {booking.bookingStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {[
                ['Booking ID', (selectedBooking.bookingId || selectedBooking._id || '').slice(-12)],
                ['Service', selectedBooking.serviceName || 'N/A'],
                ['Customer', selectedBooking.customer?.name || 'N/A'],
                ['Email', selectedBooking.customer?.email || 'N/A'],
                ['Phone', selectedBooking.customer?.phone || 'N/A'],
                ['Date', selectedBooking.bookingDate ? formatDate(selectedBooking.bookingDate) : 'N/A'],
                ['Time', selectedBooking.bookingTime || 'N/A'],
                ['Total Persons', String(selectedBooking.totalPersons || 1)],
                ['Total Amount', formatCurrency(selectedBooking.totalAmount)],
                ['Amount Paid', formatCurrency(selectedBooking.amountPaid)],
                ['Booking Status', selectedBooking.bookingStatus || 'N/A'],
                ['Payment Status', selectedBooking.paymentStatus || 'N/A'],
                ['Booked By Admin', selectedBooking.bookedByAdmin ? 'Yes' : 'No'],
                ['Created', formatDate(selectedBooking.createdAt)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">{label}</span>
                  <span className="text-gray-900">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookingPage;
