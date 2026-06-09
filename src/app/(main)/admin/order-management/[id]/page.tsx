"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/app/components/hooks/use-toast';

import { BASE_URL } from '@/config/api';

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken')
    : null;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partially_paid: 'bg-blue-100 text-blue-800',
  fully_paid: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  confirmed: 'bg-purple-100 text-purple-800',
};

const fmt = (amount?: number) => {
  if (amount == null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const fmtDate = (d?: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return 'N/A'; }
};

const OrderDetailPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [showRemittance, setShowRemittance] = useState(false);
  const [comment, setComment] = useState('');
  const [remittanceLoading, setRemittanceLoading] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/admin/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();
      if (result.success) {
        setOrder(result.data?.order ?? result.data ?? null);
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to load order', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to connect', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async () => {
    setReminderLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/admin/${id}/send-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Payment reminder sent successfully' });
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to send reminder', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to connect', variant: 'destructive' });
    } finally {
      setReminderLoading(false);
    }
  };

  const confirmRemittance = async () => {
    setRemittanceLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/admin/${id}/confirm-remittance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Remittance confirmed successfully' });
        setShowRemittance(false);
        setComment('');
        fetchOrder();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to confirm remittance', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to connect', variant: 'destructive' });
    } finally {
      setRemittanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8 min-h-screen">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 mb-6 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-center text-gray-500 mt-16">Order not found.</p>
      </div>
    );
  }

  const isPartiallyPaid = order.orderStatus === 'partially_paid';
  const displayAmount = order.actualAmount ?? order.totalAmountPaid ?? order.productPrice;

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

        {/* Title row */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{(order.orderId || order._id || '').slice(-10).toUpperCase()}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{fmtDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
              {order.orderStatus?.replace(/_/g, ' ') || 'N/A'}
            </span>
            <button
              onClick={fetchOrder}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Order Info</p>
            <dl className="space-y-3">
              {([
                ['Product', order.productName],
                ['Type', order.itemType],
                ['Organization', order.organizationName],
                ['Payment Status', order.paymentStatus?.replace(/_/g, ' ')],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900 capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Customer</p>
            <dl className="space-y-3">
              {([
                ['Name', order.customerName],
                ['Email', order.customerEmail],
                ['Phone', order.customerPhone],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Financials */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Financials</p>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Product Price</dt>
                <dd className="font-medium text-gray-900">{fmt(order.productPrice)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Total Amount</dt>
                <dd className="font-bold text-gray-900 text-base">{fmt(displayAmount)}</dd>
              </div>
            </dl>
          </div>

          {/* Payment History */}
          {Array.isArray(order.payments) && order.payments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Payment History</p>
              <div className="space-y-2">
                {order.payments.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-500">{fmtDate(p.createdAt || p.date || p.paidAt)}</span>
                    <span className="font-medium text-gray-900">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Actions</p>
          <div className="flex flex-wrap gap-3">
            {isPartiallyPaid && (
              <button
                onClick={sendReminder}
                disabled={reminderLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Bell className="w-4 h-4" />
                {reminderLoading ? 'Sending...' : 'Send Payment Reminder'}
              </button>
            )}
            <button
              onClick={() => setShowRemittance(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5D2A8B] text-white rounded-lg text-sm hover:bg-purple-700"
            >
              <CheckCircle className="w-4 h-4" /> Confirm Remittance
            </button>
          </div>

          {showRemittance && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Payment received and confirmed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={confirmRemittance}
                  disabled={remittanceLoading}
                  className="px-4 py-2 bg-[#5D2A8B] text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {remittanceLoading ? 'Confirming...' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setShowRemittance(false); setComment(''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
