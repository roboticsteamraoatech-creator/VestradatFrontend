"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { toast } from '@/app/components/hooks/use-toast';

import { BASE_URL } from '@/config/api';

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken')
    : null;

const REMITTANCE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const fmt = (amount?: number) => {
  if (amount == null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const fmtDate = (d?: string) => {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return 'N/A'; }
};

interface Settlement {
  _id: string;
  orderId?: string;
  amount?: number;
  actualAmount?: number;
  remittanceStatus?: string;
  status?: string;
  createdAt?: string;
  order?: {
    productName?: string;
    customerName?: string;
    orderStatus?: string;
  };
}

const SettlementsPage = () => {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettlements(); }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/orders/admin/settlements`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();
      if (result.success) {
        setSettlements(Array.isArray(result.data?.settlements) ? result.data.settlements : []);
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to load settlements', variant: 'destructive' });
        setSettlements([]);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to connect', variant: 'destructive' });
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSettled = settlements
    .filter(s => s.remittanceStatus === 'completed')
    .reduce((sum, s) => sum + (s.actualAmount ?? s.amount ?? 0), 0);

  const totalPending = settlements
    .filter(s => s.remittanceStatus === 'pending')
    .reduce((sum, s) => sum + (s.actualAmount ?? s.amount ?? 0), 0);

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
            <h1 className="text-2xl font-bold text-gray-900">Settlements</h1>
            <p className="text-gray-600 text-sm mt-1">Orders with remittance records for your organisation</p>
          </div>
          <button
            onClick={fetchSettlements}
            className="flex items-center gap-2 px-4 py-2 bg-[#5D2A8B] text-white rounded-lg text-sm hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary */}
        {!loading && settlements.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Records', value: settlements.length.toString() },
              { label: 'Settled Amount', value: fmt(totalSettled) },
              { label: 'Pending Amount', value: fmt(totalPending) },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{card.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Settlements table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600" />
              <span className="text-gray-500 text-sm">Loading settlements...</span>
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No settlement records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order ID', 'Product', 'Customer', 'Amount', 'Remittance', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settlements.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        #{(s.orderId || s._id).slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {s.order?.productName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {s.order?.customerName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {fmt(s.actualAmount ?? s.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REMITTANCE_COLORS[s.remittanceStatus || ''] || 'bg-gray-100 text-gray-700'}`}>
                          {s.remittanceStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {fmtDate(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettlementsPage;
