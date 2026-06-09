"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, MapPin, Plus, RefreshCw, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface Location {
  locationName?: string;
  fullAddress?: string;
  landmark?: string;
  isPaidFor?: boolean;
  verificationStatus?: string;
  _doc?: Record<string, unknown>;
  [key: string]: unknown;
}

const getLocationStatus = (loc: Location) => {
  if (!loc.isPaidFor) return { label: 'Pending Payment', bg: 'bg-orange-100', text: 'text-orange-700', icon: <Clock className="w-3.5 h-3.5" /> };
  if (loc.verificationStatus === 'verified') return { label: 'Verified', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> };
  if (loc.verificationStatus === 'rejected') return { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> };
  return { label: 'Pending Verification', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> };
};

const cleanLocation = (loc: Location): Location => {
  // Handle Mongoose metadata: if _doc exists, use it
  const base = loc._doc ? (loc._doc as Location) : loc;
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(base)) {
    if (!key.startsWith('$') && !key.startsWith('_')) {
      cleaned[key] = (base as Record<string, unknown>)[key];
    }
  }
  return cleaned as Location;
};

export default function OrgLocationsPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/organization-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load profile');
      const profile = data.data?.profile || data.profile || data.data || {};
      const locs: Location[] = (profile.locations || []).map(cleanLocation);
      setLocations(locs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Locations</h1>
              <p className="text-sm text-gray-500">{locations.length} location{locations.length !== 1 ? 's' : ''} registered</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLocations} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => router.push('/admin/subscription/verification-badge/add-location')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add Location
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading locations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchLocations} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No locations registered</p>
            <p className="text-gray-400 text-sm mt-1">Add your organization locations to enable verification</p>
            <button
              onClick={() => router.push('/admin/subscription/verification-badge/add-location')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors"
            >
              Add First Location
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc, index) => {
              const s = getLocationStatus(loc);
              return (
                <div
                  key={index}
                  onClick={() => setSelectedLocation(loc)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <MapPin className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{loc.locationName || 'Unnamed Location'}</p>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                            {s.icon} {s.label}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">{loc.fullAddress || 'No address provided'}</p>
                        {loc.landmark && <p className="text-gray-400 text-xs mt-0.5">Landmark: {loc.landmark}</p>}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/admin/subscription/verification-badge/add-location?editMode=true&locationIndex=${index}`); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLocation(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedLocation.locationName || 'Location Details'}</h2>
              <button onClick={() => setSelectedLocation(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {selectedLocation.fullAddress && (
                <div>
                  <p className="text-gray-400 text-xs">Full Address</p>
                  <p className="text-gray-900">{selectedLocation.fullAddress}</p>
                </div>
              )}
              {selectedLocation.landmark && (
                <div>
                  <p className="text-gray-400 text-xs">Landmark</p>
                  <p className="text-gray-900">{selectedLocation.landmark}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-xs">Payment Status</p>
                <p className={`font-medium ${selectedLocation.isPaidFor ? 'text-green-600' : 'text-orange-600'}`}>
                  {selectedLocation.isPaidFor ? 'Paid' : 'Payment Pending'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Verification Status</p>
                <p className="font-medium text-gray-900 capitalize">{selectedLocation.verificationStatus || 'Unverified'}</p>
              </div>
            </div>
            <button onClick={() => setSelectedLocation(null)} className="w-full mt-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
