"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, Search, User, RefreshCw, Plus, X } from 'lucide-react';

import { BASE_URL } from '@/config/api';

type StatusFilter = 'all' | 'active' | 'suspended' | 'inactive';

interface Customer {
  _id?: string;
  customerName?: string;
  email?: string;
  phoneNumber?: string;
  state?: string;
  lga?: string;
  address?: string;
  customerId?: string;
  status?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'bg-green-100',  text: 'text-green-700' },
  suspended: { bg: 'bg-red-100',    text: 'text-red-700' },
  inactive:  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'inactive', label: 'Inactive' },
];

export default function CustomersPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerName: '', email: '', phoneNumber: '', state: '', lga: '', address: '', customerId: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await fetch(`${BASE_URL}/api/super-admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load customers');
      setAllCustomers(data.customers || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(allCustomers.filter(c =>
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').toLowerCase().includes(q)
    ));
  }, [search, allCustomers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.email.trim()) { setFormError('Name and email are required'); return; }
    setCreating(true);
    setFormError('');
    try {
      const res = await fetch(`${BASE_URL}/api/super-admin/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Creation failed');
      setShowCreate(false);
      setForm({ customerName: '', email: '', phoneNumber: '', state: '', lga: '', address: '', customerId: '' });
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const getStatusStyle = (s?: string) => STATUS_COLORS[(s || '').toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-sm text-gray-500">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCustomers} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm">
              <Plus className="w-4 h-4" /> Create Customer
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-5">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading customers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No customers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((c, i) => {
              const s = getStatusStyle(c.status);
              return (
                <div key={c._id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                        {(c.customerName || 'C')[0].toUpperCase()}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{c.customerName || 'Unknown'}</p>
                    </div>
                    {c.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{c.status}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{c.email}</p>
                  {c.phoneNumber && <p className="text-xs text-gray-400 mt-0.5">{c.phoneNumber}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Create Customer</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { name: 'customerName', label: 'Customer Name *', placeholder: 'Full name' },
                { name: 'email', label: 'Email *', placeholder: 'email@example.com', type: 'email' },
                { name: 'phoneNumber', label: 'Phone Number', placeholder: '+234...' },
                { name: 'state', label: 'State', placeholder: 'Lagos' },
                { name: 'lga', label: 'LGA', placeholder: 'Ikeja' },
                { name: 'address', label: 'Address', placeholder: 'Street address' },
                { name: 'customerId', label: 'Customer ID', placeholder: 'Optional' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={(form as any)[field.name]}
                    onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
              {formError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                  {creating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
