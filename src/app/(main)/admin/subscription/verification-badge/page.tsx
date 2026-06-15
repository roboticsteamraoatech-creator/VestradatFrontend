'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  MapPin, Plus, RefreshCw, CheckCircle, XCircle, Clock,
  Trash2, Edit2, CreditCard, ShieldCheck, AlertTriangle, Loader2
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

interface Location {
  locationType?: string;
  brandName?: string;
  country?: string;
  state?: string;
  lga?: string;
  city?: string;
  cityRegion?: string;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  buildingColor?: string;
  buildingType?: string;
  isPaidFor?: boolean;
  verificationStatus?: string;
  cityRegionFee?: number;
  [key: string]: unknown;
}

function getStatus(loc: Location) {
  if (!loc.isPaidFor) return { label: 'Pending Payment', bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="w-3 h-3" /> };
  if (loc.verificationStatus === 'verified') return { label: 'Verified', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> };
  if (loc.verificationStatus === 'rejected') return { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> };
  return { label: 'Pending Verification', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> };
}

function clean(loc: any): Location {
  const base = loc._doc ?? loc;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(base)) {
    if (!k.startsWith('$') && !k.startsWith('_')) out[k] = base[k];
  }
  return out as Location;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function VerificationBadgePage() {
  const router = useRouter();
  const { token } = useAuthContext();

  const [locations, setLocations] = useState<Location[]>([]);
  const [profileInfo, setProfileInfo] = useState<{ businessType?: string; isPublicProfile?: boolean; verificationStatus?: string } | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; index: number | null; name: string }>({ open: false, index: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [profileRes, payRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/admin/organization-profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/payment/verified-badge/check-payment-required`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (profileRes.status === 'fulfilled') {
        const d = await profileRes.value.json();
        const profile = d.data?.profile || d.profile || d.data || {};
        setProfileInfo({
          businessType: profile.businessType,
          isPublicProfile: profile.isPublicProfile,
          verificationStatus: profile.verificationStatus,
        });
        setLocations((profile.locations || []).map(clean));
      }
      if (payRes.status === 'fulfilled') {
        const d = await payRes.value.json();
        setPaymentRequired(d.data?.paymentRequired ?? false);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (deleteModal.index === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/organization-profile/locations/${deleteModal.index}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Delete failed');
      setSuccess('Location deleted successfully.');
      setDeleteModal({ open: false, index: null, name: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const unpaidCount = locations.filter(l => !l.isPaidFor).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Locations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{locations.length} location{locations.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {/* <button
            onClick={() => router.push('/admin/org-profile')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Manage Profile
          </button> */}
          <button
            onClick={() => router.push('/admin/subscription/verification-badge/add-location')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </div>
      </div>

      {/* Toast messages */}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Pay for Verification banner */}
      {paymentRequired && unpaidCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Payment Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {unpaidCount} location{unpaidCount !== 1 ? 's need' : ' needs'} verification payment to get your verified badge.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/subscription/verified-badge-payment')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0"
          >
            <CreditCard className="w-4 h-4" /> Pay for Verification
          </button>
        </div>
      )}

      {/* Profile summary bar */}
      {profileInfo && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm shadow-sm">
          <div>
            <span className="text-gray-400 text-xs">Business Type: </span>
            <span className="font-medium text-gray-800 capitalize">{profileInfo.businessType || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Public Profile: </span>
            <span className="font-medium text-gray-800">{profileInfo.isPublicProfile ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Verification: </span>
            <span className={`font-medium capitalize ${
              profileInfo.verificationStatus === 'verified' ? 'text-green-600' :
              profileInfo.verificationStatus === 'pending' ? 'text-yellow-600' :
              profileInfo.verificationStatus === 'rejected' ? 'text-red-600' : 'text-gray-600'
            }`}>{profileInfo.verificationStatus || 'Unverified'}</span>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading locations…</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">No locations registered</p>
          <p className="text-gray-400 text-sm mt-1">Add your organization locations to start the verification process.</p>
          <button
            onClick={() => router.push('/admin/subscription/verification-badge/add-location')}
            className="mt-5 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Add First Location
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand / Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Region</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Country / State</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map((loc, index) => {
                  const s = getStatus(loc);
                  const address = [loc.houseNumber, loc.street].filter(Boolean).join(' ');
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">

                      {/* Brand / Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${loc.locationType === 'headquarters' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                            <MapPin className={`w-4 h-4 ${loc.locationType === 'headquarters' ? 'text-purple-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{loc.brandName || '—'}</p>
                            <p className="text-xs text-gray-400 capitalize">{loc.locationType || 'branch'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{address || '—'}</p>
                        {loc.landmark && <p className="text-xs text-gray-400 mt-0.5">Near: {loc.landmark}</p>}
                      </td>

                      {/* Region */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700">{loc.cityRegion || '—'}</p>
                        {loc.city && <p className="text-xs text-gray-400 mt-0.5">{loc.city}</p>}
                      </td>

                      {/* Country / State */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700">{loc.country || '—'}</p>
                        {loc.state && <p className="text-xs text-gray-400 mt-0.5">{loc.state}{loc.lga ? ` · ${loc.lga}` : ''}</p>}
                      </td>

                      {/* Fee */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {loc.cityRegionFee
                          ? <span className="text-sm font-medium text-gray-800">{fmt(loc.cityRegionFee)}</span>
                          : <span className="text-sm text-gray-400">—</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                          {s.icon} {s.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!loc.isPaidFor && (
                            <button
                              onClick={() => router.push('/admin/subscription/verified-badge-payment')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/admin/subscription/verification-badge/add-location?editMode=true&locationIndex=${index}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, index, name: loc.brandName || `Location ${index + 1}` })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{locations.length} location{locations.length !== 1 ? 's' : ''} total</p>
            {unpaidCount > 0 && (
              <p className="text-xs text-orange-600 font-medium">{unpaidCount} unpaid</p>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Location</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, index: null, name: '' })}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
