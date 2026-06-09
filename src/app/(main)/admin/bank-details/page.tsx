"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Building, CreditCard, User, Save, Loader2 } from 'lucide-react';

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
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Details</h1>
            <p className="text-sm text-gray-500">Register your organization bank account for remittance</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {hasExisting && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-blue-700 text-sm font-medium">You have existing bank details. Update them below.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Bank Name */}
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

            {/* Account Number */}
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

            {/* Account Name */}
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
            {success && <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm">{success}</div>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {hasExisting ? 'Update Bank Details' : 'Save Bank Details'}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
