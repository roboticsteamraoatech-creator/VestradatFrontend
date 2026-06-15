'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, CreditCard, Loader2, MapPin, Package, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

const STEPS = ['Packages', 'Profile', 'Location', 'Summary', 'Payment'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

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

export default function UpgradeStep5Page() {
  const router = useRouter();
  const { user, token } = useAuthContext();
  const [wizardData, setWizardData] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('upgradeWizard');
    if (!raw) { router.replace('/admin/subscription/upgrade'); return; }
    setWizardData(JSON.parse(raw));
  }, []);

  if (!wizardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const pkg = wizardData.selectedPackage;
  const packagePrice: number = wizardData.paymentSummary?.packagePrice ?? wizardData.packagePrice ?? 0;
  const locationFee: number = wizardData.paymentSummary?.locationVerificationPrice ?? wizardData.locationFee ?? 0;
  const totalAmount: number = wizardData.paymentSummary?.totalAmount ?? packagePrice + locationFee;
  const loc = wizardData.locationData;
  const includeVerifiedBadge: boolean = wizardData.includeVerifiedBadge ?? false;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vestradat-frontend.vercel.app';

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      if (includeVerifiedBadge && loc) {
        const locRes = await fetch(`${BASE_URL}/api/organization/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            locationType: loc.locationType,
            brandName: loc.brandName,
            country: loc.country,
            state: loc.state,
            city: loc.city,
            lga: loc.lga,
            cityRegion: loc.cityRegion,
            houseNumber: loc.houseNumber,
            street: loc.street,
            landmark: loc.landmark,
            buildingColor: loc.buildingColor,
            buildingType: loc.buildingType,
            gallery: { images: [], videos: [] },
          }),
        });
        const locData = await locRes.json();
        if (!locData.success && !locRes.ok) throw new Error(locData.message || 'Failed to add location');
      }

      const endpoint = includeVerifiedBadge && loc ? '/api/payment/combined/initialize' : '/api/payment/initialize';
      const body = includeVerifiedBadge && loc
        ? {
            userId: user?.id,
            userType: 'organization',
            packageId: pkg._id,
            subscriptionDuration: wizardData.selectedDuration,
            email: user?.email,
            name: user?.fullName,
            phone: user?.phoneNumber,
            totalAmount,
            promoCode: wizardData.promoCode || undefined,
            platform: 'web',
            redirectUrl: `${origin}/payment/verify-combined`,
            services: pkg.services?.filter((s: any) => s.duration === wizardData.selectedDuration) || [],
            includeVerifiedBadge: true,
            locations: [{ ...loc, gallery: { images: [], videos: [] } }],
          }
        : {
            userId: user?.id,
            userType: 'organization',
            packageId: pkg._id,
            subscriptionDuration: wizardData.selectedDuration,
            email: user?.email,
            name: user?.fullName,
            phone: user?.phoneNumber,
            totalAmount: packagePrice,
            promoCode: wizardData.promoCode || undefined,
            platform: 'web',
            redirectUrl: `${origin}/payment/verify`,
            services: pkg.services?.filter((s: any) => s.duration === wizardData.selectedDuration) || [],
          };

      const payRes = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const payData = await payRes.json();

      if (payData.data?.paymentLink || payData.paymentLink) {
        sessionStorage.removeItem('upgradeWizard');
        window.location.href = payData.data?.paymentLink || payData.paymentLink;
      } else {
        throw new Error(payData.message || 'Failed to initialize payment');
      }
    } catch (e: any) {
      setError(e.message || 'Payment initialization failed');
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ProgressBar current={4} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Confirm & Pay</h1>
          <p className="text-sm text-gray-500 mt-1">Your order is ready. Review and complete payment below.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-gray-800">Order Summary</h2>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-800">{pkg?.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{wizardData.selectedDuration} billing</p>
                {wizardData.promoCode && wizardData.promoDiscount > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">Promo "{wizardData.promoCode}" applied ({wizardData.promoDiscount}% off)</p>
                )}
              </div>
              <p className="text-sm font-bold text-gray-800">{fmt(packagePrice)}</p>
            </div>

            {includeVerifiedBadge && loc && locationFee > 0 && (
              <div className="flex justify-between items-start pt-3 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Location Verification</p>
                    <p className="text-xs text-gray-400 mt-0.5">{loc.brandName} · {loc.cityRegion}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800">{fmt(locationFee)}</p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 bg-purple-50 border-t border-purple-100 flex justify-between items-center">
            <span className="text-sm font-bold text-purple-900">Total</span>
            <span className="text-xl font-bold text-purple-700">{fmt(totalAmount)}</span>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700">Your payment is processed securely by Flutterwave. We never store your card details.</p>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-base hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
        >
          {paying
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Flutterwave…</>
            : <><CreditCard className="w-5 h-5" /> Pay {fmt(totalAmount)}</>
          }
        </button>

        <p className="text-xs text-center text-gray-400 mt-3">You will be redirected to complete payment on Flutterwave.</p>
      </div>
    </div>
  );
}
