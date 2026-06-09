"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, Receipt, RefreshCw } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface BillingRecord {
  id?: string;
  _id?: string;
  date?: string;
  createdAt?: string;
  description?: string;
  amount?: number;
  status?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid:      { bg: 'bg-green-100',  text: 'text-green-700' },
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  failed:    { bg: 'bg-red-100',    text: 'text-red-700' },
  refunded:  { bg: 'bg-gray-100',   text: 'text-gray-600' },
};

export default function BillingHistoryPage() {
  const router = useRouter();
  const { token, user } = useAuthContext();
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      // Try user-specific billing history endpoint; fall back gracefully
      const userId = (user as any)?.id || (user as any)?._id;
      const url = userId
        ? `${BASE_URL}/api/user-subscriptions/user/${userId}/history`
        : `${BASE_URL}/api/organization/billing-history`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load billing history');
      setRecords(data.billingHistory || data.history || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const formatDate = (dt?: string) => {
    if (!dt) return 'N/A';
    try {
      return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dt; }
  };

  const getStatusStyle = (status?: string) => {
    const key = (status || '').toLowerCase();
    return STATUS_COLORS[key] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing History</h1>
              <p className="text-sm text-gray-500">Your organization's billing transactions</p>
            </div>
          </div>
          <button onClick={fetchHistory} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading billing history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchHistory} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No billing history</p>
            <p className="text-gray-400 text-sm mt-1">Your billing transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, i) => {
              const s = getStatusStyle(record.status);
              return (
                <div key={record.id || record._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{record.description || 'Subscription Payment'}</p>
                      <p className="text-gray-400 text-xs mt-1">{formatDate(record.date || record.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">₦{(record.amount || 0).toLocaleString()}</p>
                      {record.status && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
