'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, ShieldCheck, Globe, BadgeCheck, Building2 } from 'lucide-react';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

const STEPS = ['Packages', 'Profile', 'Location', 'Summary', 'Payment'];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${i < current ? 'text-green-600' : i === current ? 'text-purple-700' : 'text-gray-400'}`}>
            {i < current
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${i === current ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
            }
            <span className="hidden sm:inline whitespace-nowrap">{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 min-w-[8px] rounded-full ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ChoiceButton({ label, sublabel, active, onClick }: { label: string; sublabel?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-xl border-2 text-left transition-all ${
        active ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-200'
      }`}
    >
      <p className={`text-sm font-semibold ${active ? 'text-purple-800' : 'text-gray-700'}`}>{label}</p>
      {sublabel && <p className={`text-xs mt-0.5 ${active ? 'text-purple-600' : 'text-gray-400'}`}>{sublabel}</p>}
    </button>
  );
}

export default function UpgradeStep2Page() {
  const router = useRouter();
  const { token } = useAuthContext();

  const [wizardData, setWizardData] = useState<any>(null);
  const [isPublicProfile, setIsPublicProfile] = useState<'yes' | 'no' | null>(null);
  const [wantsVerifiedBadge, setWantsVerifiedBadge] = useState<'yes' | 'no' | null>(null);
  const [businessType, setBusinessType] = useState<'registered' | 'unregistered' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('upgradeWizard');
    if (!raw) { router.replace('/admin/subscription/upgrade'); return; }
    setWizardData(JSON.parse(raw));

    fetch(`${BASE_URL}/api/admin/organization-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        const id = d.data?.profile?.organizationId || d.data?.profile?._id;
        if (id) setOrganizationId(id);
      })
      .catch(() => {});
  }, [token]);

  const handleNext = async () => {
    if (!isPublicProfile || !businessType) {
      setError('Please answer all required questions.'); return;
    }
    if (isPublicProfile === 'yes' && !wantsVerifiedBadge) {
      setError('Please choose whether you want a verified badge.'); return;
    }

    setSubmitting(true);
    setError(null);

    const verificationStatus =
      isPublicProfile === 'no' || wantsVerifiedBadge === 'no' ? 'unverified' : 'verified';
    const includeVerifiedBadge = isPublicProfile === 'yes' && wantsVerifiedBadge === 'yes';

    try {
      if (organizationId) {
        await fetch(`${BASE_URL}/api/organization/${organizationId}/profile-settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ businessType, isPublicProfile: isPublicProfile === 'yes', verificationStatus })
        });
      }
    } catch (_) {}

    const updated = { ...wizardData, isPublicProfile: isPublicProfile === 'yes', verificationStatus, businessType, includeVerifiedBadge };
    sessionStorage.setItem('upgradeWizard', JSON.stringify(updated));

    router.push(includeVerifiedBadge ? '/admin/subscription/upgrade/step3' : '/admin/subscription/upgrade/step5');
  };

  if (!wizardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const pkg = wizardData.selectedPackage;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ProgressBar current={1} />

        {/* Package reminder */}
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-6">
          <div>
            <p className="text-xs text-purple-500 font-medium">Selected Package</p>
            <p className="text-sm font-bold text-purple-900">{pkg?.title}</p>
          </div>
          <span className="text-sm font-semibold text-purple-700 capitalize bg-purple-100 px-3 py-1 rounded-lg">{wizardData.selectedDuration}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">Organisation Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Tell us a bit about how you want your profile set up</p>
          </div>

          <div className="px-6 py-5 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Q1: Make profile public */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-purple-500" />
                <p className="text-sm font-semibold text-gray-800">Make your profile public?</p>
              </div>
              <p className="text-xs text-gray-400 mb-3 pl-6">Public profiles appear in search results and can be discovered by customers.</p>
              <div className="flex gap-3">
                <ChoiceButton label="Yes, make it public" sublabel="Visible to everyone" active={isPublicProfile === 'yes'} onClick={() => { setIsPublicProfile('yes'); }} />
                <ChoiceButton label="No, keep private" sublabel="Only visible to you" active={isPublicProfile === 'no'} onClick={() => { setIsPublicProfile('no'); setWantsVerifiedBadge(null); }} />
              </div>
            </div>

            {/* Q2: Verified badge */}
            {isPublicProfile === 'yes' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="w-4 h-4 text-purple-500" />
                  <p className="text-sm font-semibold text-gray-800">Get a Verified Badge?</p>
                </div>
                <p className="text-xs text-gray-400 mb-3 pl-6">A verified badge builds trust with customers and shows your business is legitimate.</p>
                <div className="flex gap-3">
                  <ChoiceButton label="Yes, get verified" sublabel="Adds location verification" active={wantsVerifiedBadge === 'yes'} onClick={() => setWantsVerifiedBadge('yes')} />
                  <ChoiceButton label="No, skip for now" sublabel="Can be added later" active={wantsVerifiedBadge === 'no'} onClick={() => setWantsVerifiedBadge('no')} />
                </div>
              </div>
            )}

            {/* Q3: Business type */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-purple-500" />
                <p className="text-sm font-semibold text-gray-800">Business Registration Status</p>
              </div>
              <p className="text-xs text-gray-400 mb-3 pl-6">Is your business registered with the relevant government agency?</p>
              <div className="flex gap-3">
                <ChoiceButton label="Registered" sublabel="CAC or equivalent" active={businessType === 'registered'} onClick={() => setBusinessType('registered')} />
                <ChoiceButton label="Unregistered" sublabel="Informal business" active={businessType === 'unregistered'} onClick={() => setBusinessType('unregistered')} />
              </div>
            </div>
          </div>
        </div>

        {/* Info note for verified badge */}
        {wantsVerifiedBadge === 'yes' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">The next step will ask you to provide a location for verification. A verification fee applies.</p>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={submitting}
          className="mt-5 w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Continue'}
        </button>
      </div>
    </div>
  );
}
