'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BASE_URL } from '@/config/api';

interface FormState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  organizationName: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { token, user } = useAuthContext();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    country: '',
    organizationName: '',
  });
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const p = d.data?.user || d.user || d.data || d;
          setRole(p.role || '');
          setForm({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            phoneNumber: p.phoneNumber || '',
            country: p.country || '',
            organizationName: p.organizationName || '',
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [token]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        country: form.country,
        organizationName: form.organizationName,
      };

      const res = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update profile');
      router.back();
    } catch (e: any) {
      setError(e.message || 'Network error');
      setSaving(false);
    }
  };

  const isOrg = role === 'ORGANIZATION';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-full hover:bg-purple-700 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save
        </button>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {[
          { label: 'First Name', field: 'firstName' as const, placeholder: 'Enter first name', type: 'text' },
          { label: 'Last Name', field: 'lastName' as const, placeholder: 'Enter last name', type: 'text' },
          { label: 'Phone Number', field: 'phoneNumber' as const, placeholder: 'Enter phone number', type: 'tel' },
          ...(isOrg ? [
            { label: 'Country', field: 'country' as const, placeholder: 'Enter country', type: 'text' },
            { label: 'Organization Name', field: 'organizationName' as const, placeholder: 'Enter organization name', type: 'text' },
          ] : []),
        ].map(({ label, field, placeholder, type }) => (
          <div key={field}>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">{label}</label>
            <input
              type={type}
              value={form[field]}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={placeholder}
              inputMode={type === 'tel' ? 'numeric' : undefined}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
