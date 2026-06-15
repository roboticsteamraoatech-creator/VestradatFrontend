"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Banknote, CheckCircle, Clock, AlertCircle, Loader2, Eye, X,
  Users, Plus, Upload, Check,
} from 'lucide-react';
import ProviderSettlementService, {
  Settlement, DetailedServiceProvider, ProcessSettlementRequest,
} from '@/services/ProviderSettlementService';

type TabType = 'settlements' | 'process';
type StatusFilter = '' | 'pending' | 'confirmed';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/disz21zwr/image/upload';

// ─── helpers ────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending:   { bg: 'bg-amber-100 text-amber-800',   text: 'PENDING',   icon: <Clock className="w-3 h-3" /> },
    confirmed: { bg: 'bg-green-100 text-green-800',   text: 'CONFIRMED', icon: <CheckCircle className="w-3 h-3" /> },
    disputed:  { bg: 'bg-red-100 text-red-800',       text: 'DISPUTED',  icon: <AlertCircle className="w-3 h-3" /> },
  };
  const cfg = map[status] ?? { bg: 'bg-gray-100 text-gray-700', text: status.toUpperCase(), icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      {cfg.icon}{cfg.text}
    </span>
  );
};

const fmt = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);

const fmtDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const emptyForm = (): ProcessSettlementRequest => ({
  serviceProviderId: '',
  orderId: '',
  taskId: '',
  serviceId: '',
  description: '',
  amount: 0,
  currency: 'NGN',
  adminBankName: '',
  adminAccountNumber: '',
  settlementDate: new Date().toISOString(),
  paymentEvidenceUrl: '',
});

// ─── main component ──────────────────────────────────────────────────────────

const AdminProviderSettlementPage: React.FC = () => {
  const [activeTab, setActiveTab]           = useState<TabType>('settlements');
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [successMsg, setSuccessMsg]         = useState<string | null>(null);

  const [settlements, setSettlements]       = useState<Settlement[]>([]);
  const [providers, setProviders]           = useState<DetailedServiceProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);

  const [form, setForm]                     = useState<ProcessSettlementRequest>(emptyForm());
  const [processing, setProcessing]         = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceUploaded, setEvidenceUploaded]   = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [showDetailModal, setShowDetailModal]       = useState(false);
  const [loadingDetail, setLoadingDetail]           = useState(false);

  // ── computed stats from list ───────────────────────────────────────────────

  const stats = {
    total:     settlements.length,
    pending:   settlements.filter(s => s.settlementStatus === 'pending').length,
    confirmed: settlements.filter(s => s.settlementStatus === 'confirmed').length,
    totalPaid: settlements.reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  // ── data fetching ──────────────────────────────────────────────────────────

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ProviderSettlementService.getOrganizationSettlements(statusFilter || undefined);
      if (res.success) setSettlements(res.data.settlements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchProviders = useCallback(async () => {
    if (providers.length > 0) return;
    setLoadingProviders(true);
    try {
      const res = await ProviderSettlementService.getDetailedServiceProviders();
      if (res.success) setProviders(res.data.serviceProviders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load service providers');
    } finally {
      setLoadingProviders(false);
    }
  }, [providers.length]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);
  useEffect(() => { if (activeTab === 'process') fetchProviders(); }, [activeTab, fetchProviders]);

  // ── provider select + auto-populate ───────────────────────────────────────

  const handleProviderSelect = (provider: DetailedServiceProvider) => {
    const fee       = provider.serviceProviderFee;
    const currency  = provider.serviceProviderFeeCurrency || 'NGN';
    const frequency = provider.serviceProviderFeeFrequency || 'per_service';
    setForm(prev => ({
      ...prev,
      serviceProviderId: provider.userId,
      ...(fee && {
        amount: fee,
        currency,
        description: `Payment for completed service - ${fee} ${currency} (${frequency})`,
      }),
    }));
    setShowProviderModal(false);
  };

  // ── evidence upload (Cloudinary) ───────────────────────────────────────────

  const handleEvidenceUpload = async (file: File) => {
    setUploadingEvidence(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'vestradat_preset');
      fd.append('folder', 'verifications');
      const res    = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
      const result = await res.json();
      if (result.secure_url) {
        setForm(prev => ({ ...prev, paymentEvidenceUrl: result.secure_url }));
        setEvidenceUploaded(true);
      } else {
        setError('Image upload failed — please try again.');
      }
    } catch {
      setError('Failed to upload payment evidence.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleProcess = async () => {
    if (!form.serviceProviderId || !form.description || !form.amount ||
        !form.adminBankName || !form.adminAccountNumber || !form.paymentEvidenceUrl) {
      setError('Please fill in all required fields and upload payment evidence.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const payload: ProcessSettlementRequest = { ...form, amount: Number(form.amount) };
      if (!payload.orderId)   delete payload.orderId;
      if (!payload.taskId)    delete payload.taskId;
      if (!payload.serviceId) delete payload.serviceId;

      const res = await ProviderSettlementService.processSettlement(payload);
      if (res.success) {
        setSuccessMsg('Settlement processed successfully');
        setForm(emptyForm());
        setEvidenceUploaded(false);
        setActiveTab('settlements');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError((res as any).message || 'Failed to process settlement');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process settlement');
    } finally {
      setProcessing(false);
    }
  };

  // ── view detail ────────────────────────────────────────────────────────────

  const openDetail = async (s: Settlement) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setSelectedSettlement(null);
    try {
      const res = await ProviderSettlementService.getAdminSettlementById(s.settlementId);
      if (res.success) setSelectedSettlement(res.data.settlement);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load settlement details');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => { setShowDetailModal(false); setSelectedSettlement(null); };

  const selectedProvider = providers.find(p => p.userId === form.serviceProviderId);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Settlement</h1>
          <p className="text-gray-500 text-sm mt-1">
            Process payments to service providers and track settlement history
          </p>
        </div>
        <button
          onClick={() => { setActiveTab('process'); fetchProviders(); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5D2A8B] text-white rounded-xl text-sm font-medium hover:bg-[#4a2070] transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Process Settlement
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />{successMsg}
        </div>
      )}

      {/* ── STATS CARDS (settlements tab only) ── */}
      {activeTab === 'settlements' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
              <p className="text-xs text-amber-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
              <p className="text-xs text-green-500 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
              <p className="text-xs text-[#5D2A8B] mb-1">Total Paid</p>
              <p className="text-xl font-bold text-[#5D2A8B]">₦{stats.totalPaid.toLocaleString()}</p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 mb-5">
            {(['', 'pending', 'confirmed'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  statusFilter === s
                    ? 'bg-[#5D2A8B] text-white border-[#5D2A8B]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#5D2A8B]'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Tab toggle */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settlements' ? 'bg-[#5D2A8B] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          All Settlements
        </button>
        <button
          onClick={() => { setActiveTab('process'); fetchProviders(); }}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'process' ? 'bg-[#5D2A8B] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          Process Settlement
        </button>
      </div>

      {/* ── SETTLEMENTS LIST ── */}
      {activeTab === 'settlements' && (
        loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#5D2A8B]" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Banknote className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm mb-4">No settlements found</p>
            <button
              onClick={() => { setActiveTab('process'); fetchProviders(); }}
              className="px-5 py-2 bg-[#5D2A8B] text-white text-sm rounded-lg hover:bg-[#4a2070] transition-colors"
            >
              Process Settlement
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlements.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{s.settlementId}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                        <p className="truncate">{s.description}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {fmt(s.amount, s.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(s.settlementDate)}</td>
                      <td className="px-6 py-4"><StatusBadge status={s.settlementStatus} /></td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openDetail(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#5D2A8B] transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── PROCESS SETTLEMENT FORM ── */}
      {activeTab === 'process' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Provider selection card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#5D2A8B]" />
              <h2 className="font-semibold text-gray-900">Select Service Provider</h2>
            </div>

            {selectedProvider ? (
              <div
                className="flex items-start justify-between p-4 bg-purple-50 border border-[#5D2A8B]/20 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => setShowProviderModal(true)}
              >
                <div>
                  <p className="font-semibold text-sm text-[#5D2A8B]">
                    {selectedProvider.firstName} {selectedProvider.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedProvider.email}</p>
                  {selectedProvider.bankDetails && (
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedProvider.bankDetails.bankName} · {selectedProvider.bankDetails.accountNumber} · {selectedProvider.bankDetails.accountName}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[#5D2A8B] underline flex-shrink-0 ml-2">Change</span>
              </div>
            ) : (
              <button
                onClick={() => setShowProviderModal(true)}
                className="w-full flex flex-col items-center justify-center gap-2 py-12 border-2 border-dashed border-[#5D2A8B]/30 rounded-xl text-[#5D2A8B] hover:bg-purple-50 transition-colors"
              >
                <Users className="w-8 h-8 opacity-60" />
                <span className="text-sm font-medium">Choose a Service Provider</span>
              </button>
            )}
          </div>

          {/* Settlement details form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-5 h-5 text-[#5D2A8B]" />
              <h2 className="font-semibold text-gray-900">Settlement Details</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Process payment to service provider for completed services
            </p>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Payment for completed service"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D2A8B] resize-none"
                />
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.amount || ''}
                    onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    placeholder="5000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  >
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Admin bank */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.adminBankName}
                    onChange={e => setForm(p => ({ ...p, adminBankName: e.target.value }))}
                    placeholder="e.g. GTBank"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.adminAccountNumber}
                    onChange={e => setForm(p => ({ ...p, adminAccountNumber: e.target.value }))}
                    placeholder="0987654321"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                  />
                </div>
              </div>

              {/* Payment evidence upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Evidence <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleEvidenceUpload(f);
                  }}
                />
                {evidenceUploaded ? (
                  <div className="flex items-center justify-between border border-green-200 bg-green-50 rounded-lg px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-green-700 font-medium">
                      <Check className="w-4 h-4" /> Evidence Uploaded ✓
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEvidenceUploaded(false); setForm(p => ({ ...p, paymentEvidenceUrl: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingEvidence}
                    className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-[#5D2A8B]/40 rounded-xl text-[#5D2A8B] text-sm font-medium hover:bg-purple-50 disabled:opacity-60 transition-colors"
                  >
                    {uploadingEvidence ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingEvidence ? 'Uploading...' : 'Upload Payment Evidence'}
                  </button>
                )}
              </div>

              {/* Optional fields */}
              <details>
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                  Optional fields (Order ID, Task ID, Service ID)
                </summary>
                <div className="mt-3 space-y-3">
                  {(['orderId', 'taskId', 'serviceId'] as const).map(key => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                        {key.replace('Id', ' ID')}
                      </label>
                      <input
                        type="text"
                        value={(form[key] as string) ?? ''}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D2A8B]"
                      />
                    </div>
                  ))}
                </div>
              </details>

              <button
                onClick={handleProcess}
                disabled={processing || !form.serviceProviderId}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5D2A8B] text-white text-sm font-medium hover:bg-[#4a2070] disabled:opacity-60 transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                Process Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROVIDER PICKER MODAL ── */}
      {showProviderModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Select Service Provider</h3>
              <button onClick={() => setShowProviderModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingProviders ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#5D2A8B]" />
                </div>
              ) : providers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-10">No service providers found</p>
              ) : providers.map(p => {
                const hasBankDetails = !!p.bankDetails?.bankName;
                const isSelected     = form.serviceProviderId === p.userId;
                return (
                  <button
                    key={p.userId}
                    onClick={() => handleProviderSelect(p)}
                    disabled={!hasBankDetails}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#5D2A8B] bg-purple-50'
                        : hasBankDetails
                        ? 'border-gray-200 hover:border-[#5D2A8B] hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {hasBankDetails ? (
                          <span className="text-xs text-green-600 font-medium">Bank details added ✓</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                            No bank details
                          </span>
                        )}
                        {p.serviceProviderFee && (
                          <p className="text-xs font-semibold text-[#5D2A8B] mt-0.5 bg-purple-50 px-2 py-0.5 rounded-full">
                            {p.serviceProviderFeeCurrency || 'NGN'} {p.serviceProviderFee.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Settlement Details</h3>
              <button onClick={closeDetail}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-[#5D2A8B]" />
              </div>
            ) : selectedSettlement ? (
              <div className="px-6 py-5 space-y-5">

                {/* Status card */}
                <div className="flex flex-col items-center text-center py-5 bg-gray-50 rounded-xl">
                  <StatusBadge status={selectedSettlement.settlementStatus} />
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {fmt(selectedSettlement.amount, selectedSettlement.currency)}
                  </p>
                  <p className="font-mono text-xs text-gray-400 mt-1">{selectedSettlement.settlementId}</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selectedSettlement.description}</p>
                </div>

                {/* Provider Bank Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Provider Bank Details</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Bank Name',       value: selectedSettlement.providerBankDetails?.bankName },
                      { label: 'Account Number',  value: selectedSettlement.providerBankDetails?.accountNumber },
                      { label: 'Account Name',    value: selectedSettlement.providerBankDetails?.accountName },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-900">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Bank Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Bank Details</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Bank Name',      value: selectedSettlement.adminBankDetails?.bankName },
                      { label: 'Account Number', value: selectedSettlement.adminBankDetails?.accountNumber },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-900">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Settlement Date</span>
                      <span className="font-medium text-gray-900">{fmtDate(selectedSettlement.settlementDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Processed At</span>
                      <span className="font-medium text-gray-900">{fmtDate(selectedSettlement.processedAt)}</span>
                    </div>
                    {selectedSettlement.settlementStatus === 'confirmed' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Confirmed At</span>
                        <span className="font-medium text-gray-900">{fmtDate(selectedSettlement.providerConfirmedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Evidence image */}
                {selectedSettlement.paymentEvidenceUrl && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Evidence</p>
                    <img
                      src={selectedSettlement.paymentEvidenceUrl}
                      alt="Payment evidence"
                      className="w-full h-48 object-contain rounded-xl border border-gray-100 bg-gray-50"
                    />
                  </div>
                )}

                {/* Provider Comment */}
                {selectedSettlement.providerComment && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-semibold mb-1">Provider Comment</p>
                    <p className="text-sm text-green-800">{selectedSettlement.providerComment}</p>
                  </div>
                )}

                {/* Status alert */}
                {selectedSettlement.settlementStatus === 'pending' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-700 font-medium">Awaiting provider confirmation</p>
                  </div>
                )}
                {selectedSettlement.settlementStatus === 'confirmed' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-green-700 font-medium">Settlement confirmed by provider</p>
                  </div>
                )}

              </div>
            ) : null}

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeDetail}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProviderSettlementPage;
