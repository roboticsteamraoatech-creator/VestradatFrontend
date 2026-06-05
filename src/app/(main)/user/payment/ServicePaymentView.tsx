"use client";

import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/hooks/useAuth';
import OrderService from '@/services/OrderService';

const BASE_URL = 'https://datacapture-backend.onrender.com';

interface TimeSlot {
  datetime: string;
  time: string;
  displayTime: string;
}

interface ServicePaymentProps {
  initialOrderData: any;
}

const ServicePaymentView: React.FC<ServicePaymentProps> = ({ initialOrderData }) => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'upfront' | 'remaining' | 'full'>('upfront');
  const [orderData, setOrderData] = useState<any>({
    ...initialOrderData,
    customerEmail: '',
    customerName: '',
    customerPhone: '',
  });

  // Booking details
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Contact metadata details
  const [bookedPersonName, setBookedPersonName] = useState('');
  const [bookedPersonEmail, setBookedPersonEmail] = useState('');
  const [bookedPersonPhone, setBookedPersonPhone] = useState('');
  const [bookedPersonAge, setBookedPersonAge] = useState('');
  const [bookedPersonNotes, setBookedPersonNotes] = useState('');

  useEffect(() => {
    if (user) {
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
  }, [user]);

  // Handle live calculation parameters update queries
  useEffect(() => {
    if (!bookingDate || !orderData.organizationId) return;

    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);

    const params = new URLSearchParams({
      organizationId: orderData.organizationId,
      date: bookingDate,
    });
    if (orderData.productId && /^[0-9a-fA-F]{24}$/.test(orderData.productId)) {
      params.set('serviceId', orderData.productId);
    }

    fetch(`${BASE_URL}/api/orders/public/available-slots?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setSlots(res.data.slots); })
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [bookingDate, orderData.organizationId, orderData.productId]);

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!orderData.productId || !orderData.organizationId || !orderData.customerEmail || !orderData.customerName) {
        setError('Missing required data information fields.');
        return;
      }
      if (!bookingDate || !selectedSlot) {
        setError('Please choose your complete operational scheduling slot options.');
        return;
      }
      if (!bookedPersonName.trim()) {
        setError('Please input the identity name parameters for this allocation resource.');
        return;
      }

      const parts = bookedPersonName.trim().split(' ');
      const bookedForPersons = [{
        name: bookedPersonName.trim(),
        firstName: parts[0] || bookedPersonName,
        lastName: parts.slice(1).join(' ') || parts[0] || '',
        email: bookedPersonEmail || orderData.customerEmail,
        phone: bookedPersonPhone || undefined,
        age: bookedPersonAge || undefined,
        notes: bookedPersonNotes || undefined,
        slotDateTime: selectedSlot.datetime,
        selectedSubServices: [],
      }];

      const paymentData = {
        productId: orderData.productId,
        productName: orderData.productName || orderData.name,
        organizationId: orderData.organizationId,
        organizationName: orderData.organizationName,
        productPrice: orderData.productPrice || orderData.price,
        upfrontPercentage: orderData.upfrontPercentage || 10,
        userId: (user as any)?.id,
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone || '',
        paymentType: selectedPaymentType,
        itemType: 'service' as const,
        platform: 'web' as const,
        bookingDate,
        bookingTime: selectedSlot.time,
        bookingLocation: initialOrderData.bookingLocation || { type: 'merchant_location' },
        bookedForPersons,
        redirectUrl: `${window.location.origin}/user/payment/callback`,
      };

      const response = await OrderService.initiatePayment(paymentData, token || undefined);
      if (response.success) {
        window.location.href = response.data.link;
      } else {
        setError(response.message || 'Failed to structure dynamic allocation gateway link');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to coordinate request checkout processes');
    } finally {
      setLoading(false);
    }
  };

  const productPrice = orderData.productPrice || orderData.price || 0;
  const upfrontPayment = orderData.upfrontPayment || (productPrice * (orderData.upfrontPercentage || 10)) / 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b]">
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white flex items-center justify-between">
              <button onClick={() => router.back()} className="flex items-center text-white hover:text-gray-300 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </button>
              <h1 className="text-2xl font-bold">Service Appointment Booking</h1>
              <div className="w-16" />
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Calendar */}
              <div className="border-2 border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">1</span>
                  Select Booking Date
                </h3>
                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b]" />
              </div>

              {/* Step 2: Time Slots */}
              {bookingDate && (
                <div className="border-2 border-gray-100 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">2</span>
                    Select Time Slot
                  </h3>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-2 animate-pulse">
                      Searching open schedules...
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No remaining bookings found here.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map(slot => (
                        <button key={slot.datetime} onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1 ${
                            selectedSlot?.datetime === slot.datetime ? 'bg-[#5d2a8b] text-white' : 'bg-white text-[#5d2a8b] border-[#5d2a8b]'
                          }`}>
                          <Clock size={12} />{slot.displayTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Attendee Profiles */}
              <div className="border-2 border-purple-100 bg-purple-50/50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">3</span>
                  Who is this booking for? <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Full name *" value={bookedPersonName} onChange={e => setBookedPersonName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input type="email" placeholder="Email Address" value={bookedPersonEmail} onChange={e => setBookedPersonEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input type="tel" placeholder="Phone Number" value={bookedPersonPhone} onChange={e => setBookedPersonPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input type="number" placeholder="Age" value={bookedPersonAge} onChange={e => setBookedPersonAge(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <textarea placeholder="Special instructions notes..." value={bookedPersonNotes} onChange={e => setBookedPersonNotes(e.target.value)} rows={2} className="w-full p-3 border rounded-lg text-sm md:col-span-2 resize-none" />
                </div>
              </div>

              {/* Step 4: Split Payment Options */}
              <div className="border-2 border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">4</span>
                  Choose payment option
                </h3>
                <div className="space-y-3">
                  {[
                    { value: 'upfront' as const, label: 'Upfront Deposit', desc: `Pay ${orderData.upfrontPercentage || 10}% balance (${fmt(upfrontPayment)})` },
                    { value: 'remaining' as const, label: 'Remaining Installment', desc: `Pay remaining balance (${fmt(productPrice - upfrontPayment)})` },
                    { value: 'full' as const, label: 'Full Settlement', desc: `Pay total upfront completely (${fmt(productPrice)})` }
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentType === opt.value ? 'border-[#5d2a8b] bg-purple-50' : 'border-gray-200'
                    }`}>
                      <input type="radio" name="paymentType" value={opt.value} checked={selectedPaymentType === opt.value} onChange={e => setSelectedPaymentType(e.target.value as any)} className="text-[#5d2a8b]" />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900 text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button onClick={handleInitiatePayment} disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-white bg-[#5d2a8b] hover:bg-[#7a3aa3] text-sm transition-colors">
                {loading ? 'Processing Schedule Link...' : 'Confirm Appointment and Pay'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePaymentView;