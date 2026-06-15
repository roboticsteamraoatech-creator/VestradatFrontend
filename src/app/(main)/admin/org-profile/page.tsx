'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  ArrowLeft, Loader2, Building2, MapPin, Shield, CheckCircle,
  XCircle, Clock, Plus, Edit2, ShieldCheck, AlertCircle, CreditCard, BarChart3
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

interface Location {
  brandName?: string;
  city?: string;
  state?: string;
  isPaidFor?: boolean;
  verificationStatus?: string;
}

interface OrgProfile {
  businessType?: string;
  isPublicProfile?: boolean;
  verificationStatus?: string;
  locations?: Location[];
}

interface Limits {
  currentLimits: { locations?: number; imagesPerLocation?: number; videosPerLocation?: number };
  maxLimits: { locations?: number; imagesPerLocation?: number; videosPerLocation?: number };
}

const VS_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  verified:   { bg: 'bg-green-100',  text: 'text-green-700',  icon: <CheckCircle className="w-4 h-4" />, label: 'Verified' },
  pending:    { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-4 h-4" />,       label: 'Pending Review' },
  rejected:   { bg: 'bg-red-100',    text: 'text-red-700',    icon: <XCircle className="w-4 h-4" />,     label: 'Rejected' },
  unverified: { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: <XCircle className="w-4 h-4" />,     label: 'Unverified' },
};

function locStatus(loc: Location) {
  if (!loc.isPaidFor) return { label: 'Pending Payment', bg: 'bg-orange-100', text: 'text-orange-700' };
  if (loc.verificationStatus === 'verified') return { label: 'Verified', bg: 'bg-green-100', text: 'text-green-700' };
  if (loc.verificationStatus === 'rejected') return { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' };
  return { label: 'Pending Verification', bg: 'bg-yellow-100', text: 'text-yellow-700' };
}

export default function OrgProfilePage() {
  const router = useRouter();
  const { token } = useAuthContext();

  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, limitsRes, payRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/admin/organization-profile`,                             { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/admin/organization-profile/verification/check`,         { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/payment/verified-badge/check-payment-required`,         { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (profileRes.status === 'fulfilled') {
        const d = await profileRes.value.json();
        // Handle 3 response shapes
        if (d.data?.profile) setProfile(d.data.profile);
        else if (d.data?.verificationStatus) setProfile({ verificationStatus: d.data.verificationStatus });
        else if (d.data?.businessType) setProfile(d.data);
        else setProfile(null);
      }

      if (limitsRes.status === 'fulfilled') {
        const d = await limitsRes.value.json();
        if (d.data?.currentLimits || d.data?.maxLimits) setLimits(d.data);
      }

      if (payRes.status === 'fulfilled') {
        const d = await payRes.value.json();
        setPaymentRequired(d.data?.paymentRequired ?? false);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmitVerification = async () => {
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/organization-profile/verification/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Submission failed');
      setSuccess('Verification request submitted! An admin will review your profile.');
      fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  const verificationStatus = profile?.verificationStatus || 'unverified';
  const vstyle = VS_STYLE[verificationStatus] || VS_STYLE.unverified;
  const locations = profile?.locations || [];
  const canSubmit = verificationStatus !== 'verified' && verificationStatus !== 'pending';
  const showGetVerifiedBadge = paymentRequired && verificationStatus !== 'verified';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
            <p className="text-sm text-gray-500">Manage your profile and verification</p>
          </div>
        </div>

        {/* Toast */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Profile Info */}
          {profile ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  <h2 className="text-base font-bold text-gray-900">Business Information</h2>
                </div>
                <button
                  onClick={() => router.push('/admin/org-profile-setup')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Business Type</p>
                  <p className="font-semibold text-gray-800 capitalize">{profile.businessType || 'Not set'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Public Profile</p>
                  <p className="font-semibold text-gray-800">{profile.isPublicProfile ? 'Yes — Public' : 'No — Private'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No profile set up yet</p>
              <p className="text-gray-400 text-sm mt-1">Set up your organization profile to enable verification.</p>
              <button
                onClick={() => router.push('/admin/org-profile-setup')}
                className="mt-4 px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
              >
                Set Up Profile
              </button>
            </div>
          )}

          {/* Verification Status */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-500" />
              <h2 className="text-base font-bold text-gray-900">Verification Status</h2>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${vstyle.bg} ${vstyle.text}`}>
                {vstyle.icon} {vstyle.label}
              </span>
              {verificationStatus === 'verified' && (
                <ShieldCheck className="w-5 h-5 text-green-500" />
              )}
            </div>

            {verificationStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-700">
                Your verification was rejected. Please review your profile and resubmit.
              </div>
            )}

            {verificationStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 text-sm text-yellow-700">
                Your verification request is under review. We'll notify you once it's processed.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Get Verified Badge button (Path B — standalone payment) */}
              {showGetVerifiedBadge && (
                <button
                  onClick={() => router.push('/admin/subscription/verified-badge-payment')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Get Verified Badge
                </button>
              )}

              {/* Submit for verification (separate trigger) */}
              {canSubmit && !showGetVerifiedBadge && (
                <button
                  onClick={handleSubmitVerification}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit for Verification'}
                </button>
              )}
            </div>
          </div>

          {/* Current Limits */}
          {limits && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-bold text-gray-900">Current Limits</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Locations', cur: limits.currentLimits.locations ?? 0, max: limits.maxLimits.locations ?? 0 },
                  { label: 'Images/Location', cur: limits.currentLimits.imagesPerLocation ?? 0, max: limits.maxLimits.imagesPerLocation ?? 0 },
                  { label: 'Videos/Location', cur: limits.currentLimits.videosPerLocation ?? 0, max: limits.maxLimits.videosPerLocation ?? 0 },
                ].map(({ label, cur, max }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="text-lg font-bold text-gray-800">{cur}<span className="text-sm font-medium text-gray-400">/{max}</span></p>
                    <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cur >= max ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: max > 0 ? `${Math.min((cur / max) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locations preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-bold text-gray-900">Locations ({locations.length})</h2>
              </div>
              <button
                onClick={() => router.push('/admin/subscription/verification-badge')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Manage
              </button>
            </div>

            {locations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No locations added yet</p>
                <button
                  onClick={() => router.push('/admin/subscription/verification-badge/add-location')}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  Add Location
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.slice(0, 4).map((loc, i) => {
                  const s = locStatus(loc);
                  return (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{loc.brandName || 'Unnamed'}</p>
                          {(loc.city || loc.state) && (
                            <p className="text-xs text-gray-400">{[loc.city, loc.state].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${s.bg} ${s.text}`}>{s.label}</span>
                    </div>
                  );
                })}
                {locations.length > 4 && (
                  <button
                    onClick={() => router.push('/admin/subscription/verification-badge')}
                    className="w-full text-center text-xs text-purple-600 hover:underline pt-1"
                  >
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
