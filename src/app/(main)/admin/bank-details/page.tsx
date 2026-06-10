"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Building, CreditCard, User, Save, Loader2, Pencil, X } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function BankDetailsPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [form, setForm] = useState<BankDetails>({ bankName: '', accountNumber: '', accountName: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<BankDetails>>({});

  useEffect(() => {
    fetchBankDetails();
  }, [token]);

  const fetchBankDetails = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.bankDetails) {
        setForm(data.bankDetails);
        setHasExisting(true);
      }
    } catch {}
    setLoading(false);
  };

  const validate = () => {
    const errs: Partial<BankDetails> = {};
    if (!form.bankName.trim()) errs.bankName = 'Bank name is required';
    if (!form.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    else if (!/^\d{10}$/.test(form.accountNumber)) errs.accountNumber = 'Account number must be exactly 10 digits';
    if (!form.accountName.trim()) errs.accountName = 'Account name is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/bank-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save bank details');
      setSuccess('Bank details saved successfully!');
      setHasExisting(true);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BankDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Bank Details</h1>
            <p className="text-sm text-gray-500">View and manage your organization bank account information.</p>
          </div>
        </div>

        {/* View mode */}
        {hasExisting && !editing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-800">Saved Bank Account</h2>
              <button
                onClick={() => { setEditing(true); setSuccess(''); setError(''); }}
                className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Bank Name</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{form.bankName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Account Number</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{form.accountNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Account Name</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{form.accountName}</p>
                </div>
              </div>
            </div>

            {success && <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm">{success}</div>}
          </div>
        )}

        {/* Empty state */}
        {!hasExisting && !editing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">No bank details yet</h2>
            <p className="text-sm text-gray-500 mb-6">Add your organization's bank account to enable remittances.</p>
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Add Bank Details
            </button>
          </div>
        )}

        {/* Edit / Create form */}
        {editing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-gray-800">{hasExisting ? 'Update Bank Details' : 'Add Bank Details'}</h2>
              {hasExisting && (
                <button
                  onClick={() => { setEditing(false); setError(''); setFieldErrors({}); }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={e => handleChange('bankName', e.target.value)}
                    placeholder="e.g. First Bank of Nigeria"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-purple-500 text-sm ${fieldErrors.bankName ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {fieldErrors.bankName && <p className="text-red-500 text-xs mt-1">{fieldErrors.bankName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={e => handleChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit account number"
                    maxLength={10}
                    inputMode="numeric"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-purple-500 text-sm ${fieldErrors.accountNumber ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {fieldErrors.accountNumber ? (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.accountNumber}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">{form.accountNumber.length}/10 digits</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.accountName}
                    onChange={e => handleChange('accountName', e.target.value)}
                    placeholder="Name as on your bank account"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-purple-500 text-sm ${fieldErrors.accountName ? 'border-red-400' : 'border-gray-200'}`}
                  />
                </div>
                {fieldErrors.accountName && <p className="text-red-500 text-xs mt-1">{fieldErrors.accountName}</p>}
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> {hasExisting ? 'Update Bank Details' : 'Save Bank Details'}</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
