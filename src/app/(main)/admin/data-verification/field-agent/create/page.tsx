'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import {
  ArrowLeft, ArrowRight, MapPin, Building, FileText,
  Image as ImageIcon, Truck, Check, Loader2, AlertCircle, X, Upload
} from 'lucide-react';
import { BASE_URL } from '@/config/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface LocationOption {
  _id: string;
  locationType?: string;
  brandName?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
}

interface FormState {
  // Step 1
  selectedLocationIndex: number;
  // Step 2 (auto-filled from assignment)
  organizationName: string;
  organizationAddress: string;
  // Step 3
  fieldDetails: Record<string, string>;
  // Step 4
  photos: File[];
  // Step 5
  transportMode: string;
  transportCost: string;
  transportNotes: string;
}

const STEPS = [
  { label: 'Location', icon: MapPin },
  { label: 'Org Details', icon: Building },
  { label: 'Field Details', icon: FileText },
  { label: 'Photos', icon: ImageIcon },
  { label: 'Transport', icon: Truck },
];

// ── Component ──────────────────────────────────────────────────────────────

function CreateVerificationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthContext();

  const assignmentId = searchParams?.get('assignmentId') || '';

  const [step, setStep] = useState(0);
  const [assignment, setAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [assignmentError, setAssignmentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    selectedLocationIndex: 0,
    organizationName: '',
    organizationAddress: '',
    fieldDetails: {
      businessType: '',
      numberOfFloors: '',
      totalRooms: '',
      ownerName: '',
      ownerPhone: '',
      operatingHours: '',
      staffCount: '',
      additionalNotes: '',
    },
    photos: [],
    transportMode: '',
    transportCost: '',
    transportNotes: '',
  });

  useEffect(() => {
    if (!token || !assignmentId) { setLoadingAssignment(false); return; }
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/data-verification/assignments/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          const a = json.data?.assignment || json.data || null;
          setAssignment(a);
          if (a) {
            const loc = a.organizationLocationDetails?.[0];
            setForm(prev => ({
              ...prev,
              organizationName: a.organizationName || '',
              organizationAddress: loc
                ? [loc.houseNumber, loc.street, loc.city, loc.state, loc.country].filter(Boolean).join(', ')
                : '',
            }));
          }
        } else {
          setAssignmentError(json.message || 'Could not load assignment');
        }
      } catch (e: any) {
        setAssignmentError(e.message || 'Network error');
      } finally {
        setLoadingAssignment(false);
      }
    })();
  }, [token, assignmentId]);

  const setField = (key: string, value: string) =>
    setForm(prev => ({ ...prev, fieldDetails: { ...prev.fieldDetails, [key]: value } }));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...Array.from(files)].slice(0, 10) }));
  };

  const removePhoto = (i: number) =>
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }));

  const canNext = () => {
    if (step === 0) return true;
    if (step === 4) return !!form.transportMode;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      fd.append('assignmentId', assignmentId);
      fd.append('selectedLocationIndex', String(form.selectedLocationIndex));
      fd.append('organizationName', form.organizationName);
      fd.append('organizationAddress', form.organizationAddress);
      fd.append('fieldDetails', JSON.stringify(form.fieldDetails));
      fd.append('transportMode', form.transportMode);
      fd.append('transportCost', form.transportCost);
      fd.append('transportNotes', form.transportNotes);
      form.photos.forEach(p => fd.append('images', p));

      const res = await fetch(`${BASE_URL}/api/data-verification/with-images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Submission failed');

      const newId = json.data?.verification?._id || json.data?._id || '';
      setCreatedId(newId);

      if (newId) {
        await fetch(`${BASE_URL}/api/data-verification/${newId}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      }

      setSubmitSuccess(true);
    } catch (e: any) {
      setSubmitError(e.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">Your field verification has been submitted successfully for review.</p>
          <button
            onClick={() => router.push('/admin/data-verification/field-agent')}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700"
          >
            Back to My Assignments
          </button>
        </div>
      </div>
    );
  }

  // ── Loading assignment ──────────────────────────────────────────────────

  if (loadingAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (assignmentError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-800 mb-1">Could not load assignment</p>
          <p className="text-sm text-gray-500 mb-4">{assignmentError}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const locations: LocationOption[] = assignment?.organizationLocationDetails || [];

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Verification</h1>
          <p className="text-sm text-gray-500">{assignment?.organizationName || 'New verification'}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                i < step ? 'bg-green-500' : i === step ? 'bg-purple-600' : 'bg-gray-200'
              }`}>
                {i < step
                  ? <Check className="w-5 h-5 text-white" />
                  : <s.icon className={`w-5 h-5 ${i === step ? 'text-white' : 'text-gray-400'}`} />
                }
              </div>
              <p className={`text-xs mt-1 font-medium ${i === step ? 'text-purple-700' : 'text-gray-400'}`}>{s.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">

        {/* Step 1: Location */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Select Location</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose the location to verify from the assignment.</p>
            {locations.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No locations attached to this assignment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => setForm(prev => ({ ...prev, selectedLocationIndex: i }))}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      form.selectedLocationIndex === i
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        form.selectedLocationIndex === i ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{loc.brandName || loc.locationType || `Location ${i + 1}`}</p>
                        <p className="text-xs text-gray-400">{[loc.street, loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Org Details */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Organization Details</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Confirm the organization information for this verification.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization Name</label>
                <input
                  value={form.organizationName}
                  onChange={e => setForm(prev => ({ ...prev, organizationName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <textarea
                  value={form.organizationAddress}
                  onChange={e => setForm(prev => ({ ...prev, organizationAddress: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Full address"
                />
              </div>
              {(() => {
                const sel = locations[form.selectedLocationIndex];
                if (!sel) return null;
                return (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Selected Location Details</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[['Type', sel.locationType], ['Country', sel.country], ['State', sel.state], ['City', sel.city]].map(([l, v]) => v ? (
                        <div key={l}><span className="text-gray-400 text-xs">{l}: </span><span className="text-gray-700">{v}</span></div>
                      ) : null)}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Step 3: Field Details */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Field Verification Details</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Record what you observed at the location.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'businessType', label: 'Business Type', placeholder: 'e.g. Retail, Restaurant…' },
                { key: 'numberOfFloors', label: 'Number of Floors', placeholder: 'e.g. 3' },
                { key: 'totalRooms', label: 'Total Rooms', placeholder: 'e.g. 12' },
                { key: 'ownerName', label: "Owner's Name", placeholder: 'Full name' },
                { key: 'ownerPhone', label: "Owner's Phone", placeholder: 'Phone number' },
                { key: 'staffCount', label: 'Number of Staff', placeholder: 'e.g. 15' },
                { key: 'operatingHours', label: 'Operating Hours', placeholder: 'e.g. 8am – 6pm' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                  <input
                    value={form.fieldDetails[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={form.fieldDetails.additionalNotes}
                  onChange={e => setField('additionalNotes', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Any other observations…"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Building Pictures</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Upload photos of the building (max 10). Clear images help verification accuracy.</p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => addPhotos(e.target.files)}
            />

            <button
              onClick={() => photoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors mb-4"
            >
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-purple-700">Click to upload photos</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — up to 10 photos</p>
            </button>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.photos.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">{form.photos.length} / 10 photos selected</p>
          </div>
        )}

        {/* Step 5: Transport */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Transportation Details</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Record how you traveled to the location.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode of Transport <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Car', 'Motorcycle', 'Bus', 'Tricycle (Keke)', 'On foot', 'Other'].map(m => (
                    <button
                      key={m}
                      onClick={() => setForm(prev => ({ ...prev, transportMode: m }))}
                      className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                        form.transportMode === m
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-purple-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Cost (₦)</label>
                <input
                  type="number"
                  value={form.transportCost}
                  onChange={e => setForm(prev => ({ ...prev, transportCost: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  placeholder="0.00"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.transportNotes}
                  onChange={e => setForm(prev => ({ ...prev, transportNotes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Any transport notes…"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {submitError && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canNext() && setStep(s => s + 1)}
            disabled={!canNext()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.transportMode}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Check className="w-4 h-4" /> Submit Verification</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CreateVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <CreateVerificationInner />
    </Suspense>
  );
}
