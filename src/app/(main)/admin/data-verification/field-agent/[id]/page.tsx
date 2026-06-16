'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  ArrowLeft, Building, MapPin, User, Clock, CheckCircle,
  FileText, Image as ImageIcon, Loader2, AlertCircle, ExternalLink
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:     { bg: 'bg-amber-100',  text: 'text-amber-700' },
  in_progress: { bg: 'bg-blue-100',   text: 'text-blue-700' },
  completed:   { bg: 'bg-green-100',  text: 'text-green-700' },
  approved:    { bg: 'bg-green-100',  text: 'text-green-700' },
  draft:       { bg: 'bg-amber-100',  text: 'text-amber-700' },
  submitted:   { bg: 'bg-blue-100',   text: 'text-blue-700' },
  rejected:    { bg: 'bg-red-100',    text: 'text-red-700' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLE[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

const Field = ({ label, value }: { label: string; value?: string | number }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-sm text-gray-800">{value ?? '—'}</p>
  </div>
);

function VerificationDetailInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { token } = useAuthContext();

  const id = params?.id as string;
  const type = searchParams?.get('type') || 'assignment';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;

    const endpoint = type === 'verification'
      ? `${BASE_URL}/api/data-verification/${id}`
      : `${BASE_URL}/api/data-verification/assignments/${id}`;

    (async () => {
      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data?.assignment || json.data?.verification || json.data || null);
        } else {
          setError(json.message || 'Failed to load details');
        }
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, id, type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-1">Failed to load details</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const locationDetails = data.organizationLocationDetails || [];
  const photos = data.buildingPictures || data.images || [];
  const transport = data.transportationDetails || {};

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {type === 'verification' ? 'Verification Details' : 'Assignment Details'}
          </h1>
          <p className="text-sm text-gray-500 font-mono">{id}</p>
        </div>
        {data.status && <div className="ml-auto"><StatusBadge status={data.status} /></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Organization */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-gray-900">Organization</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Organization Name" value={data.organizationName} />
              <Field label="Organization ID" value={data.organizationId} />
              <Field label="Assigned At" value={fmtDate(data.assignedAt || data.createdAt)} />
              {data.completedAt && <Field label="Completed At" value={fmtDate(data.completedAt)} />}
            </div>
          </div>

          {/* Target User */}
          {(data.targetUserName || data.targetUserEmail || data.targetUserFirstName) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Target Contact</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={data.targetUserName || `${data.targetUserFirstName || ''} ${data.targetUserLastName || ''}`.trim()} />
                <Field label="Email" value={data.targetUserEmail} />
                <Field label="Phone" value={data.targetUserPhone} />
              </div>
            </div>
          )}

          {/* Locations */}
          {locationDetails.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Locations ({locationDetails.length})</h2>
              </div>
              <div className="space-y-3">
                {locationDetails.map((loc: any, i: number) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <p className="text-sm font-semibold text-gray-800">{loc.brandName || loc.locationType || 'Location'}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Type" value={loc.locationType} />
                      <Field label="Country" value={loc.country} />
                      <Field label="State" value={loc.state} />
                      <Field label="City" value={loc.city} />
                      <Field label="LGA" value={loc.lga} />
                      <Field label="Street" value={loc.street} />
                      <Field label="House No." value={loc.houseNumber} />
                      <Field label="Landmark" value={loc.landmark} />
                      <Field label="Building Type" value={loc.buildingType} />
                      <Field label="Building Color" value={loc.buildingColor} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Verification Details */}
          {(data.fieldVerificationDetails || data.verificationDetails) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Field Verification Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.fieldVerificationDetails || data.verificationDetails || {}).map(([k, v]) => (
                  <Field key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={String(v)} />
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">Building Pictures ({photos.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-purple-300">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Status</span>
                {data.status ? <StatusBadge status={data.status} /> : <span className="text-xs text-gray-400">—</span>}
              </div>
              {data.assignedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{fmtDate(data.assignedAt)}</span>
                </div>
              )}
              {data.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Verification complete</span>
                </div>
              )}
            </div>
          </div>

          {/* Transport Details */}
          {Object.keys(transport).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Transportation</h2>
              <div className="space-y-3">
                {Object.entries(transport).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm text-gray-800">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {type === 'assignment' && data.status === 'pending' && (
            <button
              onClick={() => router.push(`/admin/data-verification/field-agent/create?assignmentId=${id}`)}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
            >
              Start Verification
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerificationDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <VerificationDetailInner />
    </Suspense>
  );
}
