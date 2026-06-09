"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, TrendingUp, Building, DollarSign, Activity, RefreshCw } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface Analytics {
  userGrowth?: string | number;
  orgGrowth?: string | number;
  revenueGrowth?: string | number;
  activeSessions?: string | number;
  [key: string]: unknown;
}

const CARDS = [
  { key: 'userGrowth', label: 'User Growth', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', default: '0%' },
  { key: 'orgGrowth', label: 'Organization Growth', icon: Building, color: 'text-purple-600', bg: 'bg-purple-50', default: '0%' },
  { key: 'revenueGrowth', label: 'Revenue Growth', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50', default: '0%' },
  { key: 'activeSessions', label: 'Active Sessions', icon: Activity, color: 'text-red-600', bg: 'bg-red-50', default: '0' },
];

export default function SystemAnalyticsPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/super-admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load analytics');
      setAnalytics(data.data || data.analytics || data);
    } catch (err: any) {
      setError(err.message);
      setAnalytics({});
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
              <p className="text-sm text-gray-500">Platform-wide performance metrics</p>
            </div>
          </div>
          <button onClick={fetchAnalytics} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="text-yellow-700 text-sm">Analytics endpoint not available. Showing placeholder data.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CARDS.map(card => {
                const Icon = card.icon;
                const value = analytics?.[card.key] ?? card.default;
                return (
                  <div key={card.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    </div>
                    <p className={`text-3xl font-bold ${card.color}`}>{String(value)}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
