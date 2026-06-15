'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, MapPin, Package, Receipt, ChevronRight } from 'lucide-react';

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

function LineItem({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <div>
        <p className={`text-sm ${accent ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm font-semibold shrink-0 ${accent ? 'text-purple-700 text-base' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

export default function UpgradeStep4Page() {
  const router = useRouter();
  const [wizardData, setWizardData] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('upgradeWizard');
    if (!raw) { router.replace('/admin/subscription/upgrade'); return; }
    setWizardData(JSON.parse(raw));
  }, []);

  if (!wizardData) return null;

  const pkg = wizardData.selectedPackage;
  const packagePrice: number = wizardData.packagePrice ?? 0;
  const locationFee: number = wizardData.locationFee ?? 0;
  const totalAmount = packagePrice + locationFee;
  const loc = wizardData.locationData;
  const hasLocation = wizardData.includeVerifiedBadge && loc;

  const originalPrice = wizardData.promoDiscount > 0
    ? packagePrice / (1 - wizardData.promoDiscount / 100)
    : packagePrice;
  const savedAmount = originalPrice - packagePrice;

  const handleProceed = () => {
    const updated = { ...wizardData, paymentSummary: { packagePrice, locationVerificationPrice: locationFee, totalAmount } };
    sessionStorage.setItem('upgradeWizard', JSON.stringify(updated));
    router.push('/admin/subscription/upgrade/step5');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <ProgressBar current={3} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Summary</h1>
          <p className="text-sm text-gray-500 mt-1">Review your order before proceeding to payment</p>
        </div>

        {/* Package card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">Subscription Package</h2>
          </div>

          <LineItem
            label={pkg?.title ?? 'Package'}
            value={fmt(originalPrice > packagePrice ? originalPrice : packagePrice)}
            sub={`Billed ${wizardData.selectedDuration}`}
          />
          {wizardData.promoDiscount > 0 && (
            <LineItem
              label={`Promo "${wizardData.promoCode}" (${wizardData.promoDiscount}% off)`}
              value={`−${fmt(savedAmount)}`}
            />
          )}
          {wizardData.promoDiscount > 0 && (
            <LineItem label="After discount" value={fmt(packagePrice)} accent />
          )}
          {wizardData.promoDiscount === 0 && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
              <span className="text-sm font-bold text-gray-700">Subtotal</span>
              <span className="text-base font-bold text-purple-700">{fmt(packagePrice)}</span>
            </div>
          )}
        </div>

        {/* Location card */}
        {hasLocation && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-800">Location Verification</h2>
            </div>

            <div className="mb-3 text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-800">{loc.brandName}</p>
              <p>{loc.houseNumber} {loc.street}{loc.landmark ? `, ${loc.landmark}` : ''}</p>
              <p>{loc.cityRegion}, {loc.city}</p>
              <p>{loc.state}, {loc.country}</p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-700">Verification Fee</span>
              <span className="text-base font-bold text-green-700">{fmt(locationFee)}</span>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-purple-200" />
                <p className="text-xs font-semibold text-purple-200 uppercase tracking-wide">Total Amount</p>
              </div>
              <p className="text-3xl font-bold text-white">{fmt(totalAmount)}</p>
              {hasLocation && (
                <p className="text-xs text-purple-200 mt-1">Package + Location verification</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <button
          onClick={handleProceed}
          className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm"
        >
          Proceed to Payment
        </button>

        <p className="text-xs text-center text-gray-400 mt-3">You'll be redirected to Flutterwave on the next step.</p>
      </div>
    </div>
  );
}
