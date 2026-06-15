'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Loader2, Tag, X, Users, Zap, Star } from 'lucide-react';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

interface PackageService {
  serviceName: string;
  duration: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  serviceId?: string;
  _id?: string;
}

interface Package {
  _id: string;
  title: string;
  description: string;
  maxUsers?: number;
  isActive: boolean;
  services: PackageService[];
  features: string[];
}

type Duration = 'monthly' | 'quarterly' | 'yearly';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

function getPriceFor(pkg: Package, d: Duration): number {
  return pkg.services.find(s => s.duration === d)?.price ?? 0;
}

const DURATION_LABELS: Record<Duration, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };
const DURATION_BADGE: Record<Duration, string> = { monthly: '', quarterly: 'Save ~10%', yearly: 'Best Value' };

export default function UpgradeSubscriptionPage() {
  const router = useRouter();
  const { token } = useAuthContext();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalPkg, setModalPkg] = useState<Package | null>(null);
  const [duration, setDuration] = useState<Duration>('yearly');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [continuing, setContinuing] = useState(false);
  const promoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/subscription-packages/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const all: Package[] = data.data?.packages || data.packages || data.data || [];
        setPackages(all.filter(p => p.isActive));
      } catch (e: any) {
        setError(e.message || 'Failed to load packages');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const validatePromo = useCallback(
    (code: string, pkgId: string) => {
      if (promoTimer.current) clearTimeout(promoTimer.current);
      if (!code.trim()) { setPromoDiscount(0); setPromoStatus('idle'); return; }
      setPromoStatus('checking');
      promoTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`${BASE_URL}/api/user-subscriptions/validate-promo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ packageId: pkgId, promoCode: code }),
          });
          const data = await res.json();
          if (data.success && data.data?.discountPercentage) {
            setPromoDiscount(data.data.discountPercentage);
            setPromoStatus('valid');
          } else {
            setPromoDiscount(0);
            setPromoStatus('invalid');
          }
        } catch {
          setPromoDiscount(0);
          setPromoStatus('invalid');
        }
      }, 500);
    },
    [token]
  );

  const openModal = (pkg: Package) => {
    setModalPkg(pkg);
    setDuration('yearly');
    setPromoCode('');
    setPromoDiscount(0);
    setPromoStatus('idle');
    setContinuing(false);
  };

  const closeModal = () => { if (!continuing) setModalPkg(null); };

  const handlePromoChange = (val: string) => {
    setPromoCode(val);
    if (modalPkg) validatePromo(val, modalPkg._id);
  };

  const handleContinue = () => {
    if (!modalPkg) return;
    setContinuing(true);
    const subtotal = getPriceFor(modalPkg, duration);
    const discount = (subtotal * promoDiscount) / 100;
    sessionStorage.setItem('upgradeWizard', JSON.stringify({
      selectedPackage: modalPkg,
      selectedDuration: duration,
      promoCode: promoStatus === 'valid' ? promoCode : '',
      promoDiscount,
      packagePrice: subtotal - discount,
      isPublicProfile: false,
      verificationStatus: 'unverified',
      businessType: 'registered',
      includeVerifiedBadge: false,
      locationData: null,
      locationFee: 0,
    }));
    router.push('/admin/subscription/upgrade/step2');
  };

  const subtotal = modalPkg ? getPriceFor(modalPkg, duration) : 0;
  const discountAmt = (subtotal * promoDiscount) / 100;
  const total = subtotal - discountAmt;

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm text-gray-500">Loading available packages…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-sm w-full shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-800 font-semibold mb-1">Failed to load packages</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upgrade Your Subscription</h1>
            <p className="text-sm text-gray-500 mt-0.5">Select a package that fits your business needs</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="ml-11 mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs text-purple-700 font-medium">Yearly plans offer the best value</span>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No packages available at this time</p>
            <p className="text-sm text-gray-400 mt-1">Please check back later or contact support.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {packages.map((pkg, pkgIdx) => {
              const monthly = getPriceFor(pkg, 'monthly');
              const quarterly = getPriceFor(pkg, 'quarterly');
              const yearly = getPriceFor(pkg, 'yearly');
              const isPopular = pkgIdx === 1;

              return (
                <div
                  key={pkg._id}
                  className={`relative flex flex-col rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                    isPopular ? 'border-purple-400 bg-white' : 'border-gray-200 bg-white'
                  }`}
                >
                  {isPopular && (
                    <div className="bg-purple-600 text-white text-center text-xs font-bold py-1.5 tracking-wide uppercase">
                      Most Popular
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Title */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">{pkg.title}</h2>
                        {pkg.maxUsers && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full border border-purple-100">
                            <Users className="w-3 h-3" />
                            {pkg.maxUsers} users
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{pkg.description}</p>
                    </div>

                    {/* Pricing table */}
                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      {[{ label: 'Monthly', d: 'monthly' as Duration, val: monthly },
                        { label: 'Quarterly', d: 'quarterly' as Duration, val: quarterly },
                        { label: 'Yearly', d: 'yearly' as Duration, val: yearly }].filter(r => r.val > 0).map((row, i, arr) => (
                        <div key={row.d} className={`flex items-center justify-between px-4 py-2.5 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''} ${row.d === 'yearly' ? 'bg-purple-50' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${row.d === 'yearly' ? 'text-purple-700 font-semibold' : 'text-gray-600'}`}>{row.label}</span>
                            {row.d !== 'monthly' && (
                              <span className="text-xs bg-green-100 text-green-700 font-medium px-1.5 py-0.5 rounded-md">
                                {row.d === 'quarterly' ? 'Save ~10%' : 'Best value'}
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-bold ${row.d === 'yearly' ? 'text-purple-700' : 'text-gray-800'}`}>{fmt(row.val)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Included services */}
                    {pkg.services.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Included Services</p>
                        <ul className="space-y-1.5">
                          {pkg.services.slice(0, 4).map((s, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                              {s.serviceName}
                              <span className="ml-auto text-xs text-gray-400 capitalize shrink-0">{s.duration}</span>
                            </li>
                          ))}
                          {pkg.services.length > 4 && (
                            <li className="text-xs text-gray-400 pl-3.5">+{pkg.services.length - 4} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Features */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
                        <ul className="space-y-1.5">
                          {pkg.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="p-4 border-t border-gray-100">
                    <button
                      onClick={() => openModal(pkg)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                        isPopular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Select This Package
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modalPkg && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{modalPkg.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Choose your billing cycle</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Duration */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Billing Cycle</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'quarterly', 'yearly'] as Duration[]).map(d => {
                    const price = getPriceFor(modalPkg, d);
                    if (price === 0) return null;
                    return (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
                          duration === d
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200'
                        }`}
                      >
                        {d === 'yearly' && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            Best value
                          </span>
                        )}
                        <span className={`text-xs font-semibold capitalize ${duration === d ? 'text-purple-700' : 'text-gray-600'}`}>{d}</span>
                        <span className={`text-xs font-bold ${duration === d ? 'text-purple-900' : 'text-gray-800'}`}>{fmt(price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Promo code */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Promo Code <span className="normal-case font-normal text-gray-400">(optional)</span></p>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => handlePromoChange(e.target.value)}
                    placeholder="Enter promo code"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {promoStatus === 'checking' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                  {promoStatus === 'valid' && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                </div>
                {promoStatus === 'valid' && <p className="text-xs text-green-600 font-medium mt-1.5">{promoDiscount}% discount applied</p>}
                {promoStatus === 'invalid' && promoCode.trim() && <p className="text-xs text-red-500 mt-1.5">Invalid or expired promo code</p>}
              </div>

              {/* Price summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal <span className="text-gray-400 capitalize">({duration})</span></span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Promo discount ({promoDiscount}%)</span>
                    <span>−{fmt(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-purple-700">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6">
              <button
                onClick={handleContinue}
                disabled={continuing}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {continuing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : 'Continue to Setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
