"use client";

import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, AlertCircle, Clock, Calendar as CalendarIcon, User, MapPin, CheckCircle, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/hooks/useAuth';
import OrderService from '@/services/OrderService';

const BASE_URL = 'https://datacapture-backend.onrender.com';

interface TimeSlot {
  datetime: string;
  time: string;
  displayTime: string;
}

interface GuestBooking {
  id: string;
  name: string;
  email: string;
  selectedSlot: TimeSlot | null;
}

interface ServicePaymentProps {
  initialOrderData: any;
}

const ServicePaymentView: React.FC<ServicePaymentProps> = ({ initialOrderData }) => {
  const { user, token } = useAuth();
  const router = useRouter();

  // Component Steps: 1: Date, 2: Time, 3: Details & Guests, 4: Location, 5: Review & Pay
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safely extract constants out of the structured initialOrderData payload
  const serviceProduct = initialOrderData?.product || {};
  const pricing = serviceProduct?.pricing || {};

  const productId = serviceProduct.id || "";
  const organizationId = serviceProduct.organizationId || "";
  const organizationName = initialOrderData?.serviceProvider?.producer || "Service Provider";
  const serviceName = serviceProduct.name || serviceProduct.title || "Service";

  const {
    finalPrice = 0,
    upfrontPaymentPercentage = 0,
    upfrontPaymentAmount = 0,
    remainingBalance = 0,
  } = pricing;

  const [selectedPaymentType, setSelectedPaymentType] = useState<'upfront' | 'remaining' | 'full'>(
    upfrontPaymentPercentage > 0 ? 'upfront' : 'full'
  );

  // Step 1 & 2: Booking Date & Primary Time Slots
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3: Primary Customer Details & Guests
  const [customerName, setCustomerName] = useState(initialOrderData?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(initialOrderData?.customerEmail || '');
  const [customerPhone, setCustomerPhone] = useState(initialOrderData?.customerPhone || '');
  const [bookingNotes, setBookingNotes] = useState('');
  const [guests, setGuests] = useState<GuestBooking[]>([]);

  // Step 4: Location Options States
  const [locationType, setLocationType] = useState<'merchant_location' | 'customer_address' | 'new_address' | 'whatsapp_location'>('merchant_location');
  const [customAddress, setCustomAddress] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [validatingLocation, setValidatingLocation] = useState(false);

  // Sync profile details once authentication hooks yield active user maps
  useEffect(() => {
    if (user) {
      setCustomerName((user as any).fullName || initialOrderData?.customerName || '');
      setCustomerEmail((user as any).email || initialOrderData?.customerEmail || '');
      setCustomerPhone((user as any).phoneNumber || initialOrderData?.customerPhone || '');
    }
  }, [user, initialOrderData]);

  // Fetch available slots when a booking date is selected
  useEffect(() => {
    if (!bookingDate || !organizationId) return;

    setLoadingSlots(true);
    setSlots([]);
    if (currentStep === 2) setSelectedSlot(null);

    const params = new URLSearchParams({ organizationId, date: bookingDate });
    if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
      params.set('serviceId', productId);
    }

    fetch(`${BASE_URL}/api/orders/public/available-slots?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setSlots(res.data.slots); })
      .catch(console.error)
      .finally(() => setLoadingSlots(false));
  }, [bookingDate, organizationId, productId, currentStep]);

  const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  // Add Guest Sub-form Entry
  const addGuestRow = () => {
    setGuests(prev => [...prev, { id: crypto.randomUUID(), name: '', email: '', selectedSlot: null }]);
  };

  // Remove Guest Entry
  const removeGuestRow = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const updateGuestField = (id: string, field: keyof GuestBooking, value: any) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  // Step 4: Validate Location Handler
  const handleValidateLocation = async () => {
    setError(null);
    setValidatingLocation(true);

    try {
      let activeAddress = "";
      if (locationType === 'merchant_location') {
        activeAddress = initialOrderData?.serviceLocations?.[0]?.address || "Merchant's Location";
      } else if (locationType === 'new_address') {
        if (!customAddress.trim()) {
          setError("Please enter a custom street address.");
          setValidatingLocation(false);
          return;
        }
        activeAddress = customAddress;
      }

      const response = await fetch(`${BASE_URL}/api/orders/public/validate-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationType,
          address: activeAddress,
          whatsappLocationUrl: locationType === 'whatsapp_location' ? whatsappUrl : '',
          customerEmail
        })
      });

      const res = await response.json();
      if (res.success) {
        setCurrentStep(5);
      } else {
        setError(res.message || "Location verification checks failed.");
      }
    } catch (err: any) {
      setError(err.message || "Failed validating location parameter variables.");
    } finally {
      setValidatingLocation(false);
    }
  };

  const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || fullName,
      lastName: parts.slice(1).join(' ') || parts[0] || '',
    };
  };

  // Step 5: Finalize Booking Payment Initiation
  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);
    if (!bookingDate || !selectedSlot || selectedSlot === null) {
    setError('Please select a valid booking date and pick a time slot option.');
    setLoading(false);
    return;
  }

  // TypeScript now officially knows 'selectedSlot' is 100% a valid TimeSlot object here safely.
  
  if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
    setError('Please complete all required primary client identification parameters.');
    setLoading(false);
    return;
  }

    try {
      // Create main booking attendee block
      const mainNameParts = splitName(customerName);
      const mainPerson = {
        name: customerName.trim(),
        firstName: mainNameParts.firstName,
        lastName: mainNameParts.lastName,
        email: customerEmail.trim(),
        slotDateTime: selectedSlot.datetime,
        isMainBooker: true
      };

      // Transform guest records into the required array format
      const operationalGuests = guests.map(g => {
        const guestNameParts = splitName(g.name);
          return {
            name: g.name.trim(),
            firstName: guestNameParts.firstName,
            lastName: guestNameParts.lastName,
            email: g.email.trim() || undefined,
            slotDateTime: g.selectedSlot?.datetime || "",
            isMainBooker: false
          };
        });

      const bookedForPersons = [mainPerson, ...operationalGuests];

      // Format location block specifically per specification docs
      const bookingLocationPayload: any = { type: locationType };
      if (locationType === 'new_address') bookingLocationPayload.address = customAddress;
      if (locationType === 'merchant_location') bookingLocationPayload.address = initialOrderData?.serviceLocations?.[0]?.address;
      if (locationType === 'whatsapp_location') bookingLocationPayload.whatsappLocationUrl = whatsappUrl;

      const paymentData = {
        serviceId: productId,
        productId: productId,
        productName: serviceName,
        productPrice: finalPrice * (1 + guests.length), // Scale price based on total attendees
        upfrontAmount: selectedPaymentType === 'upfront' ? upfrontPaymentAmount * (1 + guests.length) : undefined,
        customerName,
        customerEmail,
        customerPhone,
        paymentType: selectedPaymentType,
        itemType: 'service' as const,
        organizationId,
        organizationName,
        bookingDate,
        bookingTime: selectedSlot?.time || "",
        bookingDuration: initialOrderData?.product?.bookingConfiguration?.slotDurationMinutes || 30,
        bookingNotes,
        bookingLocation: bookingLocationPayload,
        bookedForPersons,
        selectedSubServices: [],
        upfrontPercentage: upfrontPaymentPercentage || 0,
        upfrontPaymentPercentage: upfrontPaymentPercentage || 0,
      };

      const response = await OrderService.initiatePayment(paymentData, token || undefined);
      if (response.success) {
        window.location.href = response.data.link;
      } else {
        setError(response.message || 'Failed to initialize payment gateway.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during checkout initialization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Flow Wizard Progress Bar */}
          <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === step ? 'bg-[#5d2a8b] text-white' : currentStep > step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? '✓' : step}
                </span>
                <span className={`hidden sm:inline text-xs font-semibold ${currentStep === step ? 'text-[#5d2a8b]' : 'text-gray-400'}`}>
                  {step === 1 && "Date"}
                  {step === 2 && "Time"}
                  {step === 3 && "Details"}
                  {step === 4 && "Location"}
                  {step === 5 && "Review"}
                </span>
                {step < 5 && <div className="hidden sm:block w-8 h-[2px] bg-gray-200 ml-2" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b]">
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white flex items-center justify-between">
              <button 
                onClick={() => currentStep === 1 ? router.back() : setCurrentStep((prev) => (prev - 1) as any)} 
                className="flex items-center text-white hover:text-gray-300 transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-5 h-5 mr-1" /> Back
              </button>
              <h1 className="text-xl font-bold">Service Scheduling Window</h1>
              <div className="w-16" />
            </div>

            <div className="p-6 space-y-6">

              {/* STEP 1: SELECT A DAY */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <CalendarIcon className="text-[#5d2a8b] w-5 h-5" />
                    <h3 className="font-bold text-gray-900">Step 1: Choose Available Booking Date</h3>
                  </div>
                  <input 
                    type="date" 
                    value={bookingDate} 
                    onChange={e => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5d2a8b] focus:outline-none" 
                  />
                  <button 
                    disabled={!bookingDate}
                    onClick={() => setCurrentStep(2)}
                    className="w-full mt-4 py-3 bg-[#5d2a8b] text-white rounded-lg font-semibold text-sm disabled:bg-gray-300"
                  >
                    Proceed to Available Slots
                  </button>
                </div>
              )}

              {/* STEP 2: SELECT A TIME */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Clock className="text-[#5d2a8b] w-5 h-5" />
                    <h3 className="font-bold text-gray-900">Step 2: Available Time Slots ({bookingDate})</h3>
                  </div>
                  {loadingSlots ? (
                    <div className="text-center py-6 text-sm text-gray-500 animate-pulse">Searching schedule timelines...</div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-center text-gray-400 py-4">No available times found for this date choice.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map(slot => (
                        <button 
                          key={slot.datetime} 
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                            selectedSlot?.datetime === slot.datetime ? 'bg-[#5d2a8b] text-white border-[#5d2a8b]' : 'bg-white text-[#5d2a8b] border-[#5d2a8b] hover:bg-purple-50'
                          }`}
                        >
                          <Clock size={12} /> {slot.displayTime}
                        </button>
                      ))}
                    </div>
                  )}
                  <button 
                    disabled={!selectedSlot}
                    onClick={() => setCurrentStep(3)}
                    className="w-full mt-4 py-3 bg-[#5d2a8b] text-white rounded-lg font-semibold text-sm disabled:bg-gray-300"
                  >
                    Confirm Time Selection
                  </button>
                </div>
              )}

              {/* STEP 3: CUSTOMER AND GUEST FORM DETAILS */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <User className="text-[#5d2a8b] w-5 h-5" />
                    <h3 className="font-bold text-gray-900">Step 3: Primary Customer & Guests</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <label className="text-xs font-bold text-gray-600">Full Name *</label>
                      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-sm" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">Email Address *</label>
                      <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-sm" required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                      <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white text-sm" required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-600">Booking Instructions Note</label>
                      <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={2} className="w-full p-2.5 border rounded-lg bg-white text-sm resize-none" placeholder="Add custom request instructions..." />
                    </div>
                  </div>

                  {/* Optional Guest List Module */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1">Add Companions / Guests</h4>
                      <button onClick={addGuestRow} className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-[#5d2a8b] rounded-lg text-xs font-bold transition-colors">
                        <Plus size={14} /> Add Guest
                      </button>
                    </div>

                    {guests.map((guest, index) => (
                      <div key={guest.id} className="p-4 border-2 border-dashed border-purple-200 rounded-xl space-y-3 bg-purple-50/20 relative">
                        <button onClick={() => removeGuestRow(guest.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 size={16} />
                        </button>
                        <p className="text-xs font-bold text-[#5d2a8b]">Guest #{index + 1}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" placeholder="Guest Name *" value={guest.name} onChange={e => updateGuestField(guest.id, 'name', e.target.value)} className="w-full p-2 border rounded-lg bg-white text-xs" required />
                          <input type="email" placeholder="Guest Email (Optional)" value={guest.email} onChange={e => updateGuestField(guest.id, 'email', e.target.value)} className="w-full p-2 border rounded-lg bg-white text-xs" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 block mb-1">Select Guest Time Slot *</label>
                          <select 
                            onChange={e => {
                              const foundSlot = slots.find(s => s.datetime === e.target.value);
                              updateGuestField(guest.id, 'selectedSlot', foundSlot || null);
                            }}
                            className="w-full p-2 border rounded-lg bg-white text-xs text-gray-700"
                            required
                          >
                            <option value="">-- Assign distinct slot --</option>
                            {slots.map(s => <option key={s.datetime} value={s.datetime}>{s.displayTime}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    disabled={!customerName || !customerEmail || !customerPhone || guests.some(g => !g.name || !g.selectedSlot)}
                    onClick={() => setCurrentStep(4)}
                    className="w-full mt-4 py-3 bg-[#5d2a8b] text-white rounded-lg font-semibold text-sm disabled:bg-gray-300"
                  >
                    Proceed to Location Assignment
                  </button>
                </div>
              )}

              {/* STEP 4: SERVICE LOCATION SELECTION */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <MapPin className="text-[#5d2a8b] w-5 h-5" />
                    <h3 className="font-bold text-gray-900">Step 4: Select Execution Venue Location</h3>
                  </div>

                  <div className="space-y-3">
                    {[
                      { type: 'merchant_location', label: "Merchant's Registered Location", desc: initialOrderData?.serviceLocations?.[0]?.address || "Use service headquarters address" },
                      { type: 'customer_address', label: "My Profile Address", desc: "Use saved customer address details on record" },
                      { type: 'new_address', label: "Custom New Address", desc: "Manually input execution address parameters" },
                      { type: 'whatsapp_location', label: "WhatsApp Live Location", desc: "Paste Google Maps location link shared via WhatsApp" }
                    ].map((opt) => (
                      <label 
                        key={opt.type} 
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${locationType === opt.type ? 'border-[#5d2a8b] bg-purple-50/50' : 'border-gray-200 hover:border-purple-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <input 
                            type="radio" 
                            name="locationType" 
                            checked={locationType === opt.type} 
                            onChange={() => setLocationType(opt.type as any)} 
                            className="mt-1 text-[#5d2a8b] focus:ring-[#5d2a8b]" 
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Conditional Input UI Fields */}
                  {locationType === 'new_address' && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                      <label className="text-xs font-bold text-gray-700 block mb-1">Enter Full Delivery Address *</label>
                      <input type="text" value={customAddress} onChange={e => setCustomAddress(e.target.value)} placeholder="House number, street, city, state" className="w-full p-2.5 border bg-white rounded-lg text-xs focus:ring-1 focus:ring-[#5d2a8b]" />
                    </div>
                  )}

                  {locationType === 'whatsapp_location' && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                      <label className="text-xs font-bold text-gray-700 block mb-1">Paste Shared Google Maps/WhatsApp URL *</label>
                      <input type="url" value={whatsappUrl} onChange={e => setWhatsappUrl(e.target.value)} placeholder="https://maps.google.com/?q=..." className="w-full p-2.5 border bg-white rounded-lg text-xs focus:ring-1 focus:ring-[#5d2a8b]" />
                    </div>
                  )}

                  <button 
                    disabled={validatingLocation}
                    onClick={handleValidateLocation}
                    className="w-full mt-4 py-3 bg-[#5d2a8b] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {validatingLocation ? "Validating Location Link..." : "Validate and Review Order"}
                  </button>
                </div>
              )}

              {/* STEP 5: CONFIRM AND PAY */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <CheckCircle className="text-green-600 w-5 h-5" />
                    <h3 className="font-bold text-gray-900">Step 5: Review & Complete Payment</h3>
                  </div>

                  {/* Booking Recap Card */}
                  <div className="bg-gray-50 border rounded-xl p-4 text-xs space-y-2 text-gray-700">
                    <p><strong className="text-gray-900">Selected Service:</strong> {serviceName}</p>
                    <p><strong className="text-gray-900">Appointment Date & Time:</strong> {bookingDate} @ {selectedSlot?.displayTime}</p>
                    <p><strong className="text-gray-900">Total Attendees:</strong> {1 + guests.length} person(s) (1 Client {guests.length > 0 && `+ ${guests.length} Guest(s)`})</p>
                    <p><strong className="text-gray-900">Target Venue:</strong> {locationType === 'merchant_location' ? "Merchant Headquarters" : locationType === 'new_address' ? customAddress : "Custom Location Link Provided"}</p>
                  </div>

                  {/* Payment Matrix Selection */}
                  <div className="border-2 border-gray-100 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-gray-900 tracking-wide uppercase">Select Split Configuration Method</h4>
                    {[
                      { value: 'full' as const, label: 'Full Settlement', desc: `Pay full amount complete (${fmt(finalPrice * (1 + guests.length))})` },
                      { value: 'upfront' as const, label: 'Upfront Deposit', desc: `Pay ${upfrontPaymentPercentage}% safety deposit (${fmt(upfrontPaymentAmount * (1 + guests.length))})` },
                      { value: 'remaining' as const, label: 'Remaining Installment', desc: `Pay remaining balance (${fmt(remainingBalance * (1 + guests.length))})` }
                    ]
                      .filter(opt => (opt.value !== 'upfront' && opt.value !== 'remaining') || upfrontPaymentPercentage > 0)
                      .map(opt => (
                        <label key={opt.value} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentType === opt.value ? 'border-[#5d2a8b] bg-purple-50/60' : 'border-gray-200'}`}>
                          <input type="radio" name="paymentMethod" value={opt.value} checked={selectedPaymentType === opt.value} onChange={e => setSelectedPaymentType(e.target.value as any)} className="text-[#5d2a8b] focus:ring-[#5d2a8b]" />
                          <div className="ml-3">
                            <p className="font-bold text-gray-900 text-xs">{opt.label}</p>
                            <p className="text-[11px] text-gray-500">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                  </div>

                  {/* Security Clearance Notice */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex gap-3 items-start">
                    <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900 text-xs">Secure Payment Escrow Processing</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Transactions are coordinated securely over Flutterwave infrastructure. Slots hold once verified.</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-700 font-medium">{error}</span>
                    </div>
                  )}

                  <button 
                    onClick={handleInitiatePayment} 
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-bold text-white bg-[#5d2a8b] hover:bg-[#7a3aa3] text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing Schedule Link...' : 'Confirm Appointment and Secure Slots'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePaymentView;