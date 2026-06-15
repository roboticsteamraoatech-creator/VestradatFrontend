"use client";

import React, { useState, useEffect } from 'react';
import { toast } from '@/app/components/hooks/use-toast';
import { Download, CheckCircle, RefreshCw } from 'lucide-react';
import { BASE_URL } from '@/config/api';

interface Remittance {
  organizationBankName: string;
  organizationAccountNumber: string;
  organizationAccountName: string;
  amountRemitted: number;
  settlementDate: string;
  superAdminBankName: string;
  superAdminAccountNumber: string;
  paymentEvidenceUrl: string;
  remittanceStatus: 'pending' | 'confirmed';
  organizationComment: string | null;
  organizationConfirmedAt: string | null;
}

interface Settlement {
  orderId: string;
  orderStatus: string;
  remittance: Remittance;
}

const formatCurrency = (amount?: number) => {
  if (amount == null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const OrderPage = () => {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  useEffect(() => { loadSettlements(); }, []);

  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken')
      : null;

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/orders/admin/settlements`, {
        headers: { ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
      });
      const result = await response.json();
      if (result.success) {
        setSettlements(Array.isArray(result.data?.settlements) ? result.data.settlements : []);
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to load settlements', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to connect', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const confirmRemittance = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const comment = commentMap[orderId] || '';
      const response = await fetch(`${BASE_URL}/api/orders/admin/${orderId}/confirm-remittance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        },
        body: JSON.stringify({ comment }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Remittance confirmed successfully' });
        loadSettlements();
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to confirm remittance', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to connect', variant: 'destructive' });
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading settlements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap'); * { font-family: 'Manrope', sans-serif; }`}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Settlements</h2>
            <p className="text-gray-600 mt-1">Remittances processed by Super Admin — confirm receipt here.</p>
          </div>
          <button
            onClick={loadSettlements}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Amount Remitted', 'Settlement Date', 'Our Bank', 'Evidence', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No remittances found. The Super Admin must process a remittance first.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s, idx) => {
                    const r = s.remittance;
                    const isPending = r.remittanceStatus !== 'confirmed';
                    return (
                      <tr key={s.orderId || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {s.orderId?.slice(-10) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(r.amountRemitted)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(r.settlementDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{r.organizationBankName}</div>
                          <div className="text-xs text-gray-400">{r.organizationAccountNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {r.paymentEvidenceUrl ? (
                            <a
                              href={r.paymentEvidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-purple-600 hover:text-purple-800"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.remittanceStatus === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {r.remittanceStatus === 'confirmed' ? 'Confirmed' : 'Pending'}
                          </span>
                          {r.organizationConfirmedAt && (
                            <div className="text-xs text-gray-400 mt-0.5">{formatDate(r.organizationConfirmedAt)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isPending ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                type="text"
                                placeholder="Optional comment"
                                value={commentMap[s.orderId] || ''}
                                onChange={(e) => setCommentMap(prev => ({ ...prev, [s.orderId]: e.target.value }))}
                                className="w-36 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                              />
                              <button
                                onClick={() => confirmRemittance(s.orderId)}
                                disabled={confirmingId === s.orderId}
                                className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-60"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {confirmingId === s.orderId ? 'Confirming...' : 'Confirm'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {r.organizationComment || 'Confirmed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
