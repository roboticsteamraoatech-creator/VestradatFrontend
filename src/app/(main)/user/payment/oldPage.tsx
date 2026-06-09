"use client";

import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/hooks/useAuth';
import OrderService from '@/services/OrderService';

import { BASE_URL } from '@/config/api';

interface TimeSlot {
  datetime: string;
  time: string;
  displayTime: string;
}

const PaymentPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'upfront' | 'remaining' | 'full'>('upfront');
  const [orderData, setOrderData] = useState<any>(null);
  const [bookingLocation, setBookingLocation] = useState<any>(null);

  // Date + slot picker
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booked-for person
  const [bookedPersonName, setBookedPersonName] = useState('');
  const [bookedPersonEmail, setBookedPersonEmail] = useState('');
  const [bookedPersonPhone, setBookedPersonPhone] = useState('');
  const [bookedPersonAge, setBookedPersonAge] = useState('');
  const [bookedPersonNotes, setBookedPersonNotes] = useState('');

  // Load product data from localStorage
  useEffect(() => {
    const savedProduct = localStorage.getItem('selectedProduct');
    if (savedProduct) {
      try {
        const p = JSON.parse(savedProduct);
        setOrderData({
          productId: p.productId,
          productName: p.name,
          productPrice: p.price,
          upfrontPayment: p.upfrontPayment || p.price * 0.1,
          organizationId: p.organizationId || '',
          organizationName: p.organizationName || 'Service Provider',
          customerEmail: '',
          customerName: '',
          customerPhone: '',
          upfrontPercentage: p.upfrontPercentage || 10,
          itemType: p.itemType,
        });
        
        // Force products to go directly to full payment structure rather than partial methods
        if (p.itemType === 'product') {
          setSelectedPaymentType('full');
        }

        if (p.bookingLocation) setBookingLocation(p.bookingLocation);
      } catch {
        setError('Failed to load order data');
      }
    } else {
      setError('No order data found. Please select a product first.');
    }
  }, []);

  // Fill customer info from user once available
  useEffect(() => {
    if (user && orderData) {
      setOrderData((prev: any) => ({
        ...prev,
        customerEmail: (user as any).email || '',
        customerName: (user as any).fullName || '',
        customerPhone: (user as any).phoneNumber || '',
      }));
      setBookedPersonName((user as any).fullName || '');
      setBookedPersonEmail((user as any).email || '');
      setBookedPersonPhone((user as any).phoneNumber || '');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch available slots when date changes (services only)
  useEffect(() => {
    if (!bookingDate || !orderData || orderData.itemType !== 'service') return;
    if (!orderData.organizationId) return;

    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    const params = new URLSearchParams({
      organizationId: orderData.organizationId,
      date: bookingDate,
    });
    // Include serviceId if it looks like an ObjectId
    if (orderData.productId && /^[0-9a-fA-F]{24}$/.test(orderData.productId)) {
      params.set('serviceId', orderData.productId);
    }

    fetch(`${BASE_URL}/api/orders/public/available-slots?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setSlots(res.data.slots); })
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [bookingDate, orderData?.organizationId, orderData?.productId, orderData?.itemType]);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d2a8b] mx-auto mb-4"></div>
          <p className="text-gray-600">{error || 'Loading payment information...'}</p>
          {error && (
            <button onClick={() => router.back()} className="mt-4 text-[#5d2a8b] underline text-sm">Go back</button>
          )}
        </div>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const isService = orderData.itemType === 'service';

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!orderData.productId || !orderData.organizationId || !orderData.customerEmail || !orderData.customerName) {
        setError('Missing required information. Please ensure you are logged in.');
        return;
      }
      if (isService && !bookingDate) {
        setError('Please select a booking date.');
        return;
      }
      if (isService && !selectedSlot) {
        setError('Please select an available time slot.');
        return;
      }
      if (isService && !bookedPersonName.trim()) {
        setError('Please enter the name of the person this booking is for.');
        return;
      }

      const bookedForPersons = isService ? (() => {
        const parts = bookedPersonName.trim().split(' ');
        return [{
          name: bookedPersonName.trim(),
          firstName: parts[0] || bookedPersonName,
          lastName: parts.slice(1).join(' ') || parts[0] || '',
          email: bookedPersonEmail || orderData.customerEmail,
          phone: bookedPersonPhone || undefined,
          age: bookedPersonAge || undefined,
          notes: bookedPersonNotes || undefined,
          slotDateTime: selectedSlot!.datetime,
          selectedSubServices: [],
        }];
      })() : undefined;

      const paymentData = {
        productId: orderData.productId,
        productName: orderData.productName,
        organizationId: orderData.organizationId,
        organizationName: orderData.organizationName,
        productPrice: orderData.productPrice,
        upfrontPercentage: orderData.upfrontPercentage,
        userId: (user as any)?.id,
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone || '',
        paymentType: selectedPaymentType,
        itemType: orderData.itemType,
        platform: 'web' as const,
        bookingDate: bookingDate || undefined,
        bookingTime: selectedSlot?.time || undefined,
        bookingLocation: bookingLocation || { type: 'merchant_location' },
        bookedForPersons,
        redirectUrl: `${window.location.origin}/user/payment/callback`,
      };

      const response = await OrderService.initiatePayment(paymentData, token || undefined);
      if (response.success) {
        window.location.href = response.data.link;
      } else {
        setError(response.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  // Build the list of permitted paths depending on whether item is hardware/physical or booking/virtual
  const allowedPaymentOptions = isService 
    ? [
        { value: 'upfront' as const, label: 'Upfront Payment', desc: `Pay ${orderData.upfrontPercentage}% upfront (${fmt(orderData.upfrontPayment)})` },
        { value: 'remaining' as const, label: 'Remaining Balance', desc: `Pay remaining balance (${fmt(orderData.productPrice - orderData.upfrontPayment)})` },
        { value: 'full' as const, label: 'Full Payment', desc: `Pay full amount (${fmt(orderData.productPrice)})` }
      ]
    : [
        { value: 'full' as const, label: 'Full Payment', desc: `Pay full amount (${fmt(orderData.productPrice)})` }
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b]">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white flex items-center justify-between">
              <button onClick={() => router.back()} className="flex items-center text-white hover:text-gray-300 transition-colors hover:cursor-pointer">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </button>
              <h1 className="text-2xl font-bold">Payment</h1>
              <div className="w-16" />
            </div>

            <div className="p-6 space-y-6">

              {/* ── Service: Date picker ── */}
              {isService && (
                <div className="border-2 border-gray-100 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">1</span>
                    Select Booking Date
                  </h3>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>
              )}

              {/* ── Service: Slot picker ── */}
              {isService && bookingDate && (
                <div className="border-2 border-gray-100 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">2</span>
                    Select Time Slot
                  </h3>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5d2a8b]" />
                      Loading available slots...
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No available slots for this date. Please choose another date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map(slot => {
                        const sel = selectedSlot?.datetime === slot.datetime;
                        return (
                          <button key={slot.datetime} onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors flex items-center justify-center gap-1 ${
                              sel ? 'bg-[#5d2a8b] text-white border-[#5d2a8b]' : 'bg-white text-[#5d2a8b] border-[#5d2a8b] hover:bg-purple-50'
                            }`}>
                            <Clock size={12} />{slot.displayTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Service: Booked-for person ── */}
              {isService && (
                <div className="border-2 border-purple-100 bg-purple-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-7 h-7 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">3</span>
                    Who is this booking for? <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                      <input type="text" placeholder="Enter full name" value={bookedPersonName}
                        onChange={e => setBookedPersonName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input type="email" placeholder="email@example.com" value={bookedPersonEmail}
                        onChange={e => setBookedPersonEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                      <input type="tel" placeholder="+234..." value={bookedPersonPhone}
                        onChange={e => setBookedPersonPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                      <input type="number" placeholder="Age" value={bookedPersonAge}
                        onChange={e => setBookedPersonAge(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Special notes</label>
                      <textarea placeholder="Any special requests..." value={bookedPersonNotes}
                        onChange={e => setBookedPersonNotes(e.target.value)} rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Payment type ── */}
              <div className="border-2 border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">
                    {isService ? 4 : 1}
                  </span>
                  Choose payment option
                </h3>
                <div className="space-y-3">
                  {allowedPaymentOptions.map(opt => (
                    <label key={opt.value} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentType === opt.value ? 'border-[#5d2a8b] bg-purple-50' : 'border-gray-200 hover:border-[#5d2a8b]'
                    }`}>
                      <input type="radio" name="paymentType" value={opt.value}
                        checked={selectedPaymentType === opt.value}
                        onChange={e => setSelectedPaymentType(e.target.value as any)}
                        className="h-4 w-4 text-[#5d2a8b] focus:ring-[#5d2a8b]" />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900 text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* ── Secure notice ── */}
              <div className="p-4 bg-gray-50 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Secure Payment via Flutterwave</p>
                  <p className="text-xs text-gray-500 mt-0.5">You will be redirected to complete payment securely.</p>
                </div>
              </div>

              {/* ── Submit ── */}
              <button onClick={handleInitiatePayment} disabled={loading || !orderData}
                className={`w-full py-3 rounded-lg font-semibold transition-colors text-sm ${
                  loading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-[#5d2a8b] text-white hover:bg-[#7a3aa3]'
                }`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </span>
                ) : `Pay ${selectedPaymentType === 'upfront' ? 'Upfront' : selectedPaymentType === 'remaining' ? 'Remaining' : 'Full'} Amount`}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;