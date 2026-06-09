"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, Building } from 'lucide-react';

import { BASE_URL } from '@/config/api';

export default function OrgProfileSetupPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [businessType, setBusinessType] = useState<'registered' | 'unregistered'>('registered');
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/organization-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessType, isPublicProfile, verificationStatus: 'unverified' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save profile');
      router.push('/admin/org-locations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const RadioGroup = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string; description?: string }[];
  }) => (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
              value === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                value === opt.value ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
              }`}>
                {value === opt.value && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                {opt.description && <p className="text-gray-500 text-xs mt-0.5">{opt.description}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Profile Setup</h1>
            <p className="text-sm text-gray-500">Configure your organization profile settings</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900">Business Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup
              label="Business Registration Status"
              value={businessType}
              onChange={v => setBusinessType(v as 'registered' | 'unregistered')}
              options={[
                { value: 'registered', label: 'Registered Business', description: 'Your business is officially registered with a government body' },
                { value: 'unregistered', label: 'Unregistered Business', description: 'Your business operates without formal government registration' },
              ]}
            />

            <RadioGroup
              label="Public Profile"
              value={isPublicProfile ? 'yes' : 'no'}
              onChange={v => setIsPublicProfile(v === 'yes')}
              options={[
                { value: 'yes', label: 'Yes — Make profile public', description: 'Your organization profile will be visible to the public' },
                { value: 'no', label: 'No — Keep profile private', description: 'Only users with direct access can view your profile' },
              ]}
            />

            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : 'Next — Add Locations →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
