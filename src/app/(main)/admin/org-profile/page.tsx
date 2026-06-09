"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, Building, MapPin, Shield, CheckCircle, XCircle, Clock, Plus, Edit } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface Location {
  locationName?: string;
  fullAddress?: string;
  isPaidFor?: boolean;
  verificationStatus?: string;
}

interface OrgProfile {
  businessType?: string;
  isPublicProfile?: boolean;
  verificationStatus?: string;
  locations?: Location[];
}

interface EligibilityCheck {
  eligible: boolean;
  requirements?: string[];
  missingRequirements?: string[];
}

const getLocationStatusStyle = (loc: Location) => {
  if (!loc.isPaidFor) return { label: 'Pending Payment', bg: 'bg-orange-100', text: 'text-orange-700' };
  if (loc.verificationStatus === 'verified') return { label: 'Verified', bg: 'bg-green-100', text: 'text-green-700' };
  if (loc.verificationStatus === 'rejected') return { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' };
  return { label: 'Pending Verification', bg: 'bg-orange-100', text: 'text-orange-700' };
};

const VERIFICATION_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  verified: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  unverified: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <XCircle className="w-4 h-4" /> },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-4 h-4" /> },
};

export default function OrgProfilePage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, eligRes, payRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/admin/organization-profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/admin/organization-profile/verification/check`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/payment/verified-badge/check-payment-required`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (profileRes.status === 'fulfilled') {
        const d = await profileRes.value.json();
        setProfile(d.data?.profile || d.profile || d.data || null);
      }
      if (eligRes.status === 'fulfilled') {
        const d = await eligRes.value.json();
        setEligibility(d.data || d);
      }
      if (payRes.status === 'fulfilled') {
        const d = await payRes.value.json();
        setPaymentRequired(d.data?.paymentRequired || d.paymentRequired || false);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/organization-profile/verification/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess('Verification request submitted successfully!');
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const verificationStatus = profile?.verificationStatus || 'unverified';
  const vstyle = VERIFICATION_STYLES[verificationStatus] || VERIFICATION_STYLES.unverified;
  const locations = profile?.locations || [];
  const canSubmit = eligibility?.eligible && verificationStatus !== 'pending' && verificationStatus !== 'verified';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
            <p className="text-sm text-gray-500">Manage your organization profile and verification</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Profile Info */}
          {profile ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Profile Info</h2>
                </div>
                <button
                  onClick={() => router.push('/admin/org-profile-setup')}
                  className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Business Type</p>
                  <p className="font-medium text-gray-900 capitalize">{profile.businessType || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Public Profile</p>
                  <p className="font-medium text-gray-900">{profile.isPublicProfile ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No profile set up yet</p>
              <button
                onClick={() => router.push('/admin/org-profile-setup')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors"
              >
                Set Up Profile
              </button>
            </div>
          )}

          {/* Verification Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${vstyle.bg} ${vstyle.text}`}>
                {vstyle.icon}
                {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
              </span>
            </div>

            {eligibility && (
              <div className="mb-4">
                {(eligibility.missingRequirements || []).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-3">
                    <p className="text-yellow-700 text-sm font-medium mb-2">Missing Requirements:</p>
                    <ul className="space-y-1">
                      {eligibility.missingRequirements!.map((req, i) => (
                        <li key={i} className="text-yellow-600 text-xs flex items-center gap-1.5">
                          <XCircle className="w-3 h-3" /> {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(eligibility.requirements || []).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-600 text-sm font-medium mb-2">Requirements:</p>
                    <ul className="space-y-1">
                      {eligibility.requirements!.map((req, i) => (
                        <li key={i} className="text-gray-500 text-xs flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-green-500" /> {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl mb-3">{error}</div>}
            {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-xl mb-3">{success}</div>}

            {canSubmit && (
              <button
                onClick={handleSubmitVerification}
                disabled={submitting}
                className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit for Verification'}
              </button>
            )}
          </div>

          {/* Locations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Locations ({locations.length})</h2>
              </div>
              <button
                onClick={() => router.push('/admin/org-locations')}
                className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800"
              >
                <Plus className="w-4 h-4" /> Manage
              </button>
            </div>
            {locations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No locations added yet</p>
                <button
                  onClick={() => router.push('/admin/subscription/verification-badge/add-location')}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors"
                >
                  Add Location
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.slice(0, 3).map((loc, i) => {
                  const s = getLocationStatusStyle(loc);
                  return (
                    <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{loc.locationName || 'Unnamed Location'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{loc.fullAddress || 'No address'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} whitespace-nowrap ml-2`}>{s.label}</span>
                    </div>
                  );
                })}
                {locations.length > 3 && (
                  <button onClick={() => router.push('/admin/org-locations')} className="text-sm text-purple-600 hover:underline">
                    View all {locations.length} locations →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
