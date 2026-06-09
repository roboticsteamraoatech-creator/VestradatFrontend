"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, Search, ShoppingBag, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface Order {
  _id?: string;
  productName?: string;
  organizationName?: string;
  customerName?: string;
  orderStatus?: string;
  totalAmount?: number;
  createdAt?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:       { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  partially_paid:{ bg: 'bg-blue-100',   text: 'text-blue-700' },
  fully_paid:    { bg: 'bg-green-100',  text: 'text-green-700' },
  cancelled:     { bg: 'bg-red-100',    text: 'text-red-700' },
};

const formatCurrency = (amt?: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amt || 0);

export default function SuperAdminOrdersPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/orders/super-admin/all?page=${pg}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load orders');
      setOrders(data.orders || data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.totalOrders || data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(page); }, [page]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(orders.filter(o =>
      (o.productName || '').toLowerCase().includes(q) ||
      (o.organizationName || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q)
    ));
  }, [search, orders]);

  const getStatusStyle = (s?: string) => STATUS_COLORS[(s || '').toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  const formatDate = (dt?: string) => {
    if (!dt) return 'N/A';
    try { return new Date(dt).toLocaleDateString('en-US', { dateStyle: 'medium' }); } catch { return dt; }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Orders</h1>
              <p className="text-sm text-gray-500">{totalOrders} total orders</p>
            </div>
          </div>
          <button onClick={() => fetchOrders(page)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {filtered.map((order, i) => {
                const s = getStatusStyle(order.orderStatus);
                return (
                  <div
                    key={order._id || i}
                    onClick={() => router.push(`/super-admin/order-details/${order._id}`)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{order.productName || 'Unknown Product'}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} whitespace-nowrap`}>
                            {(order.orderStatus || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Org: {order.organizationName || 'N/A'} · Customer: {order.customerName || 'N/A'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
