'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, MapPin, Building, Home } from 'lucide-react';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

const STEPS = ['Packages', 'Profile', 'Location', 'Summary', 'Payment'];

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-shadow';
const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

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

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-purple-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function UpgradeStep3Page() {
  const router = useRouter();
  const { token } = useAuthContext();

  const [wizardData, setWizardData] = useState<any>(null);
  const [countries, setCountries] = useState<{ name: string; isoCode: string }[]>([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [cityRegions, setCityRegions] = useState<{ name: string; fee?: number }[]>([]);
  const [locationFee, setLocationFee] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    locationType: 'headquarters' as 'headquarters' | 'branch' | 'warehouse',
    brandName: '',
    country: '',
    countryCode: '',
    state: '',
    lga: '',
    city: '',
    cityRegion: '',
    houseNumber: '',
    street: '',
    landmark: '',
    buildingColor: '',
    buildingType: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const raw = sessionStorage.getItem('upgradeWizard');
    if (!raw) { router.replace('/admin/subscription/upgrade'); return; }
    setWizardData(JSON.parse(raw));
    import('country-state-city').then(({ Country }) => {
      setCountries(Country.getAllCountries().map((c: any) => ({ name: c.name, isoCode: c.isoCode })));
    });
  }, []);

  useEffect(() => {
    if (!form.countryCode) { setStates([]); return; }
    import('country-state-city').then(({ State }) => {
      setStates(State.getStatesOfCountry(form.countryCode).map((s: any) => ({ name: s.name, isoCode: s.isoCode })));
    });
    setForm(p => ({ ...p, state: '', lga: '', city: '', cityRegion: '' }));
    setCities([]); setCityRegions([]); setLocationFee(null);
  }, [form.countryCode]);

  useEffect(() => {
    if (!form.country || !form.state) { setCities([]); return; }
    fetch(`${BASE_URL}/api/cities?country=${encodeURIComponent(form.country)}&state=${encodeURIComponent(form.state)}&lga=${encodeURIComponent(form.lga)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setCities(d.data?.cities || d.cities || [])).catch(() => {});
  }, [form.country, form.state, form.lga, token]);

  useEffect(() => {
    if (!form.city) { setCityRegions([]); setLocationFee(null); return; }
    fetch(`${BASE_URL}/api/city-regions?country=${encodeURIComponent(form.country)}&state=${encodeURIComponent(form.state)}&lga=${encodeURIComponent(form.lga)}&city=${encodeURIComponent(form.city)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setCityRegions(d.data?.cityRegions || d.cityRegions || [])).catch(() => {});
    set('cityRegion', ''); setLocationFee(null);
  }, [form.city]);

  const fetchLocationFee = useCallback(async (cityRegion: string) => {
    if (!cityRegion) return;
    setLoadingFee(true);
    try {
      const q = new URLSearchParams({ country: form.country, state: form.state, lga: form.lga, city: form.city, cityRegion });
      const res = await fetch(`${BASE_URL}/api/payment/location/pricing?${q}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setLocationFee(d.data?.price ?? d.data?.fee ?? d.fee ?? null);
    } catch { setLocationFee(null); }
    finally { setLoadingFee(false); }
  }, [form.country, form.state, form.lga, form.city, token]);

  useEffect(() => {
    if (form.cityRegion) fetchLocationFee(form.cityRegion);
  }, [form.cityRegion, fetchLocationFee]);

  const handleNext = () => {
    if (!form.brandName || !form.country || !form.state || !form.city || !form.cityRegion || !form.houseNumber || !form.street) {
      setError('Please fill in all required fields.'); return;
    }
    const updated = { ...wizardData, locationData: { ...form }, locationFee: locationFee ?? 0 };
    sessionStorage.setItem('upgradeWizard', JSON.stringify(updated));
    router.push('/admin/subscription/upgrade/step4');
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

  if (!wizardData) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ProgressBar current={2} />

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Your Location</h1>
          <p className="text-sm text-gray-500 mt-1">This location will be verified and shown on your public profile with a verified badge.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Section 1: Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4 space-y-4">
          <SectionHeader icon={Building} title="Business Details" subtitle="Your brand name and location type" />

          {/* Location type */}
          <div>
            <label className={lbl}>Location Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['headquarters', 'branch', 'warehouse'] as const).map(t => (
                <button key={t} type="button" onClick={() => set('locationType', t)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${form.locationType === t ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Brand Name <span className="text-red-500 normal-case">*</span></label>
            <input className={inp} value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="Your business / brand name" />
          </div>
        </div>

        {/* Section 2: Region */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4 space-y-4">
          <SectionHeader icon={MapPin} title="Region" subtitle="Country, state, and local area" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Country <span className="text-red-500 normal-case">*</span></label>
              <select className={inp} value={form.countryCode}
                onChange={e => {
                  const c = countries.find(x => x.isoCode === e.target.value);
                  set('countryCode', e.target.value); set('country', c?.name || '');
                }}>
                <option value="">Select country</option>
                {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>State <span className="text-red-500 normal-case">*</span></label>
              <select className={inp} value={form.state} onChange={e => set('state', e.target.value)} disabled={!states.length}>
                <option value="">{states.length ? 'Select state' : 'Select country first'}</option>
                {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>LGA</label>
              <input className={inp} value={form.lga} onChange={e => set('lga', e.target.value)} placeholder="Local Government Area" disabled={!form.state} />
            </div>

            <div>
              <label className={lbl}>City <span className="text-red-500 normal-case">*</span></label>
              {cities.length > 0 ? (
                <select className={inp} value={form.city} onChange={e => set('city', e.target.value)}>
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input className={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City name" disabled={!form.state} />
              )}
            </div>
          </div>

          {/* City Region + fee */}
          <div>
            <label className={lbl}>City Region <span className="text-red-500 normal-case">*</span></label>
            {cityRegions.length > 0 ? (
              <select className={inp} value={form.cityRegion} onChange={e => set('cityRegion', e.target.value)}>
                <option value="">Select city region</option>
                {cityRegions.map(r => <option key={typeof r === 'string' ? r : r.name} value={typeof r === 'string' ? r : r.name}>{typeof r === 'string' ? r : r.name}</option>)}
              </select>
            ) : (
              <input className={inp} value={form.cityRegion} onChange={e => set('cityRegion', e.target.value)} placeholder="City region / area" disabled={!form.city} />
            )}
          </div>

          {/* Location fee */}
          {loadingFee && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking verification fee…</span>
            </div>
          )}
          {locationFee !== null && !loadingFee && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Location Verification Fee</p>
                <p className="text-xs text-purple-500 mt-0.5">One-time fee for this location</p>
              </div>
              <p className="text-base font-bold text-purple-800">{fmt(locationFee)}</p>
            </div>
          )}
        </div>

        {/* Section 3: Street address */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
          <SectionHeader icon={Home} title="Street Address" subtitle="Exact address for verification" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>House Number <span className="text-red-500 normal-case">*</span></label>
              <input className={inp} value={form.houseNumber} onChange={e => set('houseNumber', e.target.value)} placeholder="e.g. 12" />
            </div>
            <div>
              <label className={lbl}>Street <span className="text-red-500 normal-case">*</span></label>
              <input className={inp} value={form.street} onChange={e => set('street', e.target.value)} placeholder="Street name" />
            </div>
          </div>

          <div>
            <label className={lbl}>Nearest Landmark</label>
            <input className={inp} value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder="E.g. Opposite First Bank" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Building Color</label>
              <input className={inp} value={form.buildingColor} onChange={e => set('buildingColor', e.target.value)} placeholder="e.g. White" />
            </div>
            <div>
              <label className={lbl}>Building Type</label>
              <input className={inp} value={form.buildingType} onChange={e => set('buildingType', e.target.value)} placeholder="e.g. Bungalow" />
            </div>
          </div>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm"
        >
          Continue to Summary
        </button>
      </div>
    </div>
  );
}
