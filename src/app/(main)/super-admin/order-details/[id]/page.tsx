"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, ShoppingBag, User, Package, CreditCard, Truck } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface OrderDetails {
  _id?: string;
  productName?: string;
  itemType?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  organizationName?: string;
  customerInfo?: { name?: string; email?: string; phone?: string };
  deliveryInfo?: { method?: string; address?: string; pickupCenter?: string };
  paymentHistory?: Array<{ date?: string; amount?: number; status?: string; method?: string }>;
  createdAt?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:       { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  partially_paid:{ bg: 'bg-blue-100',   text: 'text-blue-700' },
  fully_paid:    { bg: 'bg-green-100',  text: 'text-green-700' },
  cancelled:     { bg: 'bg-red-100',    text: 'text-red-700' },
  successful:    { bg: 'bg-green-100',  text: 'text-green-700' },
  failed:        { bg: 'bg-red-100',    text: 'text-red-700' },
};

const formatCurrency = (amt?: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amt || 0);

export default function SuperAdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthContext();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !orderId) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/orders/super-admin/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load order');
        setOrder(data.order || data.data || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [token, orderId]);

  const getStatusStyle = (s?: string) => STATUS_COLORS[(s || '').toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  const formatDate = (dt?: string) => {
    if (!dt) return 'N/A';
    try { return new Date(dt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }); } catch { return dt; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-600 font-medium">{error || 'Order not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-purple-600 hover:underline">← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-sm text-gray-500 font-mono">{orderId}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Product</p>
                <p className="font-medium text-gray-900">{order.productName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Type</p>
                <p className="font-medium text-gray-900 capitalize">{order.itemType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Organization</p>
                <p className="font-medium text-gray-900">{order.organizationName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Order Date</p>
                <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Order Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.orderStatus).bg} ${getStatusStyle(order.orderStatus).text}`}>
                  {(order.orderStatus || '').replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Payment Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.paymentStatus).bg} ${getStatusStyle(order.paymentStatus).text}`}>
                  {order.paymentStatus || 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-400 text-xs mb-0.5">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          {/* Customer Info */}
          {order.customerInfo && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {order.customerInfo.name && <div><p className="text-gray-400 text-xs">Name</p><p className="font-medium text-gray-900">{order.customerInfo.name}</p></div>}
                {order.customerInfo.email && <div><p className="text-gray-400 text-xs">Email</p><p className="font-medium text-gray-900">{order.customerInfo.email}</p></div>}
                {order.customerInfo.phone && <div><p className="text-gray-400 text-xs">Phone</p><p className="font-medium text-gray-900">{order.customerInfo.phone}</p></div>}
              </div>
            </div>
          )}

          {/* Delivery Info */}
          {order.deliveryInfo && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Delivery</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {order.deliveryInfo.method && <div><p className="text-gray-400 text-xs">Method</p><p className="font-medium text-gray-900 capitalize">{order.deliveryInfo.method}</p></div>}
                {order.deliveryInfo.address && <div><p className="text-gray-400 text-xs">Address</p><p className="font-medium text-gray-900">{order.deliveryInfo.address}</p></div>}
                {order.deliveryInfo.pickupCenter && <div><p className="text-gray-400 text-xs">Pickup Center</p><p className="font-medium text-gray-900">{order.deliveryInfo.pickupCenter}</p></div>}
              </div>
            </div>
          )}

          {/* Payment History */}
          {order.paymentHistory && order.paymentHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
              </div>
              <div className="space-y-3">
                {order.paymentHistory.map((payment, i) => {
                  const s = getStatusStyle(payment.status);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.date)} · {payment.method || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{payment.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
