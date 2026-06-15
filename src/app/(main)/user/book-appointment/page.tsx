"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Clock,
  Globe,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Lock,
  AlertCircle,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingService, {
  ServiceItem,
  TimeSlot,
  LocationOption,
  BookingLocation,
} from "@/services/BookingService";

// Import the user authentication context hook
import { useAuthContext } from "@/AuthContext"; // Adjust this relative path to match your file tree

// Import the Calendar Component and its default style rules
import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';

import { BASE_URL } from '@/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubService {
  subServiceId: string;
  name: string;
  description: string;
  code: string;
  price: number;
  imageUrl?: string;
}

interface GuestForm {
  id: number; // 0 = primary
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  notes: string;
  selectedSubServices: SubService[];
}

type LocationType =
  | "merchant_location"
  | "customer_address"
  | "new_address"
  | "whatsapp_location";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || parts[0] || "" };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BookAppointmentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Consume user profile object securely from the authentication state provider
  const { user } = useAuthContext();

  // Strip platform unique code suffix
  const rawOrganizationId = searchParams.get("organizationId") || "";
  const organizationId = rawOrganizationId.replace(/-\d{3}-\d{3}$/, "");
  const serviceId = searchParams.get("serviceId") || "";

  // ── Service & loading ──
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Calendar state mapping ──
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allowedDates, setAllowedDates] = useState<string[]>([]);
  const [currentMonthYear, setCurrentMonthYear] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // ── Slots ──
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Guests ──
  const makeGuest = (id: number): GuestForm => ({
    id, name: "", firstName: "", lastName: "", email: "", phone: "", age: "", notes: "", selectedSubServices: [],
  });
  const [guests, setGuests] = useState<GuestForm[]>([makeGuest(0)]);

  // ── Location ──
  const [locationType, setLocationType] = useState<LocationType>("merchant_location");
  const [newAddress, setNewAddress] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [locationOptions, setLocationOptions] = useState<{
    merchantLocation?: LocationOption;
    customerAddress?: LocationOption;
    newAddress?: LocationOption;
    whatsappLocation?: LocationOption;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ── Sub-services & pricing ──
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "upfront">("full");

  // ── Booking notes ──
  const [bookingNotes, setBookingNotes] = useState("");

  // ── Submission ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Autofill primary booker form fields when profile initializes ──────────
  useEffect(() => {
    if (user) {
      setGuests((prev) =>
        prev.map((g) => {
          if (g.id === 0) {
            const nameString = user.fullName || "";
            const { firstName, lastName } = splitName(nameString);
            return {
              ...g,
              name: nameString,
              firstName,
              lastName,
              email: user.email || "",
              phone: user.phoneNumber || "",
            };
          }
          return g;
        })
      );
    }
  }, [user]);

  // ─── Load service from localStorage ───────────────────────────────────────
  useEffect(() => {
    if (!organizationId) { setError("Organization ID is required"); setLoading(false); return; }
    try {
      const raw = localStorage.getItem("appointmentProduct");
      if (!raw) { setError("No service data found. Please select a service first."); setLoading(false); return; }
      const data = JSON.parse(raw);
      let svc: ServiceItem;
      if (data.isSubService && data.selectedSubService) {
        const ss = data.selectedSubService;
        svc = { id: serviceId || ss.subPlatformUniqueCode || "", name: ss.name || data.name || "Service",
          description: ss.description || "", price: ss.price || 0, duration: ss.duration || 60,
          hasAvailability: true, imageUrl: "", hasSubServices: false, subServices: [] };
      } else {
        svc = { id: serviceId || data.product?.id || data.id || "",
          name: data.product?.name || data.name || "Service", description: data.product?.description || data.description || "",
          price: data.product?.pricing?.discountedPrice || data.product?.pricing?.originalPrice || data.price || data.actualAmount || 0,
          duration: data.product?.duration || data.duration || 60,
          hasAvailability: true, imageUrl: data.product?.images?.main || data.imageUrl || "",
          hasSubServices: data.product?.hasSubServices || data.hasSubServices || false, subServices: data.product?.subServices || data.subServices || [] };
      }
      setService(svc);
    } catch { setError("Failed to load service details"); }
    finally { setLoading(false); }
  }, [organizationId, serviceId]);

  // ─── Fetch location options ────────────────────────────────────────────────
  useEffect(() => {
    if (!service || !organizationId) return;
    BookingService.getLocationOptions({ organizationId, serviceId: serviceId || undefined })
      .then((res) => {
        if (res.success) {
          setLocationOptions(res.data.locationOptions);
          const def = res.data.defaultOption as LocationType;
          if (def) setLocationType(def);
        }
      })
      .catch(console.error);
  }, [service, organizationId, serviceId]);

  // ─── Fetch sub-services ────────────────────────────────────────────────────
  useEffect(() => {
    if (!service?.id) return;
    const validId = /^[0-9a-fA-F]{24}$/.test(service.id) || /^ORG.*-\d+$/.test(service.id);
    if (!validId) return;
    fetch(`${BASE_URL}/api/orders/public/services/${service.id}/sub-services`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setSubServices(res.data.subServices); })
      .catch(console.error);
  }, [service]);

  // ─── Fetch available days ──────────────────────────────────────────────────
  useEffect(() => {
    if (!organizationId) return;
    const safeId = serviceId && (/^[0-9a-fA-F]{24}$/.test(serviceId) || /^ORG.*-\d+$/.test(serviceId))
      ? serviceId : undefined;
    BookingService.getAvailableDays({ organizationId, month: currentMonthYear.month, year: currentMonthYear.year, serviceId: safeId })
      .then((res) => { if (res.success) setAllowedDates(res.data.availableDays); })
      .catch(() => setAllowedDates([]));
  }, [organizationId, currentMonthYear, serviceId]);

  // ─── Fetch slots when date selected ───────────────────────────────────────
  useEffect(() => {
    if (!selectedDate || !organizationId) return;
    setLoadingSlots(true);
    BookingService.getAvailableSlots({ organizationId, date: selectedDate, serviceId: serviceId || undefined })
      .then((res) => { if (res.success) { setSlots(res.data.slots); setSelectedSlot(null); } })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, organizationId, serviceId]);

  // ─── Calculate pricing ────────────────────────────────────────────────────
  const calculatePricing = useCallback(async (currentGuests: GuestForm[], type: "full" | "upfront") => {
    if (!service?.id || !organizationId) return;
    setPricingLoading(true);
    try {
      const bookedForPersons = currentGuests.map((g) => ({
        name: g.name.trim() || `Guest ${g.id + 1}`,
        selectedSubServices: g.selectedSubServices,
      }));
      const res = await fetch(`${BASE_URL}/api/orders/public/calculate-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, organizationId, paymentType: type, bookedForPersons }),
      });
      const data = await res.json();
      if (data.success) {
        setPricingBreakdown(data.data);
        if (data.data?.upfrontPercentage && paymentType === "upfront") {
          setPaymentType("upfront");
        }
      }
    } catch (e) { console.error("Pricing error:", e); }
    finally { setPricingLoading(false); }
  }, [service, organizationId, paymentType]);

  // Sync pricing updates on step changes or mutation structures
  useEffect(() => {
    calculatePricing(guests, paymentType);
  }, [guests, paymentType, calculatePricing]);

  // ─── Calendar Disabled Configuration Interceptor ───────────────────────────
  const isTileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localISODate = `${year}-${month}-${day}`;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      if (date < today) return true;

      return !allowedDates.includes(localISODate);
    }
    return false;
  };

  const handleCalendarNavigate = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setCurrentMonthYear({
        month: activeStartDate.getMonth() + 1,
        year: activeStartDate.getFullYear()
      });
    }
  };

  // ─── Guest Helpers ─────────────────────────────────────────────────────────
  const addGuest = () => setGuests((prev) => [...prev, makeGuest(Date.now())]);
  const removeGuest = (id: number) => setGuests((prev) => prev.filter((g) => g.id !== id));
  const updateGuest = (id: number, field: keyof GuestForm, value: string) =>
    setGuests((prev) => prev.map((g) => {
      if (g.id !== id) return g;
      const updated = { ...g, [field]: value };
      if (field === "name") {
        const { firstName, lastName } = splitName(value);
        updated.firstName = firstName;
        updated.lastName = lastName;
      }
      return updated;
    }));

  const toggleSubService = (guestId: number, sub: SubService) => {
    setGuests((prev) => prev.map((g) => {
      if (g.id !== guestId) return g;
      const exists = g.selectedSubServices.some((s) => s.subServiceId === sub.subServiceId);
      const updated = exists
        ? g.selectedSubServices.filter((s) => s.subServiceId !== sub.subServiceId)
        : [...g.selectedSubServices, sub];
      return { ...g, selectedSubServices: updated };
    }));
  };

  // ─── Submit / Initiate Payment ─────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!service || !selectedDate || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      let bookingLocation: BookingLocation;
      switch (locationType) {
        case "merchant_location": bookingLocation = { type: "merchant_location" }; break;
        case "customer_address":  bookingLocation = { type: "customer_address" };  break;
        case "new_address":       bookingLocation = { type: "new_address", address: newAddress }; break;
        case "whatsapp_location": bookingLocation = { type: "whatsapp_location", whatsappLocationUrl: whatsappLink }; break;
        default:                  bookingLocation = { type: "merchant_location" };
      }

      const bookedForPersons = guests.map((g, i) => ({
        name: g.name.trim() || `Guest ${i + 1}`,
        firstName: g.firstName || splitName(g.name).firstName || `Guest`,
        lastName: g.lastName || splitName(g.name).lastName || `${i + 1}`,
        email: g.email,
        phone: g.phone || undefined,
        age: g.age || undefined,
        notes: g.notes || undefined,
        slotDateTime: selectedSlot.datetime,
        selectedSubServices: g.selectedSubServices.map((s) => ({
          subServiceId: s.subServiceId,
          name: s.name,
          code: s.code,
          price: s.price,
        })),
        individualTotal: pricingBreakdown?.individualBreakdowns?.[i]?.individualTotal,
      }));

      const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
      let userId: string | undefined;
      if (token) {
        try { const p = JSON.parse(atob(token.split(".")[1])); userId = p.userId || p.id; } catch {}
      }

      const response = await BookingService.initiatePayment({
        productId: service.id,
        productName: service.name,
        organizationId,
        organizationName: locationOptions?.merchantLocation?.address || "",
        productPrice: service.price,
        upfrontPercentage: paymentType === "full" ? 100 : (pricingBreakdown?.upfrontPercentage ?? 50),
        userId,
        customerEmail: guests[0].email,
        customerName: guests[0].name.trim() || "Guest",
        customerPhone: guests[0].phone || undefined,
        paymentType,
        itemType: "service",
        platform: "web",
        bookingDate: selectedDate,
        bookingTime: selectedSlot.time,
        bookingDuration: service.duration,
        bookingLocation,
        bookedForPersons,
        bookingNotes: bookingNotes || undefined,
      });

      if (response.success && response.data.link) {
        window.location.href = response.data.link;
      } else {
        alert("Failed to initiate payment. Please try again.");
        setIsSubmitting(false);
      }
    } catch (e: any) {
      console.error("Booking error:", e);
      alert(e.message || "Failed to process booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <span className="animate-spin h-10 w-10 text-[#5d2a8b] mx-auto block rounded-full border-b-2 border-[#5d2a8b]" />
        <p className="text-sm text-gray-500 font-medium">Loading execution schedules...</p>
      </div>
    </div>
  );

  if (error || !service) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-500 font-medium">{error || "No active context found."}</p>
        <button onClick={() => router.back()} className="text-xs text-[#5d2a8b] font-bold hover:underline">← Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b]">
            
            {/* Header Layout */}
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white flex items-center justify-between">
              <button onClick={() => router.back()} className="flex items-center text-white hover:text-gray-300 transition-colors font-medium text-sm">
                <ArrowLeft className="w-5 h-5 mr-1" /> Back
              </button>
              <h1 className="text-xl font-bold">Service Appointment Booking</h1>
              <div className="w-16" />
            </div>

            <div className="p-6 space-y-8 divide-y divide-gray-100">

              {/* Step 1: Core Calendar View Frame */}
              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">1</span>
                  Select Appointment Date
                </h3>
                
                <div className="border border-b-gray-100 p-4 rounded-xl mb-2 text-xs bg-purple-50/20 text-gray-600 flex gap-4 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={13} /> {service.duration} mins</span>
                  <span className="flex items-center gap-1"><Globe size={13} /> West Africa Time (WAT)</span>
                  <span className="font-bold text-[#5d2a8b] ml-auto">{formatCurrency(service.price)}</span>
                </div>

                <div className="custom-calendar-container flex justify-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <Calendar 
                    onActiveStartDateChange={handleCalendarNavigate}
                    tileDisabled={isTileDisabled}
                    onClickDay={(value) => {
                      const offsetDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
                      setSelectedDate(offsetDate.toISOString().split('T')[0]);
                    }}
                    value={selectedDate ? new Date(selectedDate) : null}
                    className="w-full border-0 bg-transparent text-sm text-gray-800"
                  />
                </div>
                {selectedDate && (
                  <p className="text-xs font-bold text-green-600 flex items-center gap-1">✓ Selected Date: {selectedDate}</p>
                )}
              </div>

              {/* Step 2: Time Slots Timeline Selection Area */}
              <div className="space-y-4 pt-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">2</span>
                  Select Time Slot
                </h3>
                {!selectedDate ? (
                  <p className="text-xs text-gray-400 italic">Please select an highlighted active day on the calendar matrix above.</p>
                ) : loadingSlots ? (
                  <div className="text-xs text-gray-500 py-2 animate-pulse">Searching matching slots...</div>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No remaining bookings found for this day view.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map(slot => (
                      <button key={slot.time} type="button" onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1 ${
                          selectedSlot?.time === slot.time ? 'bg-[#5d2a8b] text-white' : 'bg-white text-[#5d2a8b] border-[#5d2a8b] hover:bg-purple-50/50'
                        }`}>
                        <Clock size={12} />{slot.displayTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Attendee Profiles and Form */}
              <div className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">3</span>
                    Who is this booking for? <span className="text-red-500 ml-0.5">*</span>
                  </h3>
                  <button type="button" onClick={addGuest} className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-[#5d2a8b] rounded-lg text-xs font-bold transition-all">
                    <Plus size={12} /> Add Person
                  </button>
                </div>

                {guests.map((guest, idx) => (
                  <div key={guest.id} className="p-4 border border-gray-200 rounded-xl space-y-3 bg-white relative shadow-sm">
                    {idx > 0 && (
                      <button type="button" onClick={() => removeGuest(guest.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                    <p className="text-xs font-bold text-[#5d2a8b]">{idx === 0 ? "Primary Booker Profile Information" : `Guest #${idx + 1} Profile Information`}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Full Name *</label>
                        <input type="text" placeholder="Enter full name" value={guest.name} onChange={e => updateGuest(guest.id, "name", e.target.value)} className="w-full px-3 py-2 border bg-white rounded-lg text-xs focus:outline-none focus:border-[#5d2a8b]" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Email Address{idx === 0 ? " *" : ""}</label>
                        <input type="email" placeholder="email@example.com" value={guest.email} onChange={e => updateGuest(guest.id, "email", e.target.value)} className="w-full px-3 py-2 border bg-white rounded-lg text-xs focus:outline-none focus:border-[#5d2a8b]" required={idx === 0} />
                      </div>
                      {idx === 0 && (
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-gray-500 block mb-1">Phone Number</label>
                          <input type="tel" placeholder="+234..." value={guest.phone} onChange={e => updateGuest(guest.id, "phone", e.target.value)} className="w-full px-3 py-2 border bg-white rounded-lg text-xs focus:outline-none focus:border-[#5d2a8b]" />
                        </div>
                      )}
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Age (Optional)</label>
                        <input type="number" placeholder="Age" value={guest.age} onChange={e => updateGuest(guest.id, "age", e.target.value)} className="w-full px-3 py-2 border bg-white rounded-lg text-xs focus:outline-none focus:border-[#5d2a8b]" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Special Notes or Instructions</label>
                        <textarea placeholder="Add any custom requests notes..." value={guest.notes} onChange={e => updateGuest(guest.id, "notes", e.target.value)} rows={2} className="w-full p-3 border bg-white rounded-lg text-xs resize-none focus:outline-none focus:border-[#5d2a8b]" />
                      </div>
                    </div>

                    {/* Sub-Services Add-ons block if available */}
                    {subServices.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Optional Add-ons for this Person</label>
                        <div className="space-y-1.5">
                          {subServices.map(sub => {
                            const isChecked = guest.selectedSubServices.some(s => s.subServiceId === sub.subServiceId);
                            return (
                              <label key={sub.subServiceId} className={`flex items-center justify-between p-2 border.5 rounded-lg cursor-pointer transition-all ${isChecked ? 'bg-purple-50/60 border-[#5d2a8b]' : 'bg-gray-50/50 border-gray-200'}`}>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" checked={isChecked} onChange={() => toggleSubService(guest.id, sub)} className="text-[#5d2a8b] rounded" />
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900">{sub.name}</p>
                                    {sub.description && <p className="text-[10px] text-gray-400 leading-tight">{sub.description}</p>}
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-[#5d2a8b]">{formatCurrency(sub.price)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step 4: Venue and Location Selection */}
              <div className="space-y-4 pt-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">4</span>
                  Select Execution Venue Location
                </h3>
                <div className="space-y-2">
                  {[
                    { type: 'merchant_location', label: "Merchant's Registered Location", desc: locationOptions?.merchantLocation?.address || "Use service headquarters address" },
                    { type: 'customer_address', label: "My Profile Address", desc: "Use saved customer address details on record" },
                    { type: 'new_address', label: "Custom New Address", desc: "Manually input execution address parameters" },
                    { type: 'whatsapp_location', label: "WhatsApp Live Location", desc: "Paste Google Maps location link shared via WhatsApp" }
                  ].map((opt) => (
                    <label key={opt.type} className={`block p-3.5 border-2 rounded-xl cursor-pointer transition-all ${locationType === opt.type ? 'border-[#5d2a8b] bg-purple-50/40' : 'border-gray-200 hover:border-purple-200'}`}>
                      <div className="flex items-start gap-2.5">
                        <input type="radio" name="locationGroup" checked={locationType === opt.type} onChange={() => setLocationType(opt.type as any)} className="mt-1 text-[#5d2a8b]" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {locationType === 'new_address' && (
                  <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Enter full manual house address, street name, city, state *" className="w-full p-2.5 border bg-white rounded-lg text-xs focus:ring-1 focus:ring-[#5d2a8b] focus:outline-none" />
                )}
                {locationType === 'whatsapp_location' && (
                  <input type="url" value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} placeholder="Paste shared Google Maps/WhatsApp location link URL *" className="w-full p-2.5 border bg-white rounded-lg text-xs focus:ring-1 focus:ring-[#5d2a8b] focus:outline-none" />
                )}

                {/* Static Location Information Alert Box Banner */}
                <div className="p-4 bg-white border border-purple-200 rounded-xl flex gap-3 items-start shadow-sm mt-4">
                  <div className="w-5 h-5 rounded-full bg-[#5d2a8b] text-white flex items-center justify-center font-serif text-xs font-bold flex-shrink-0 mt-0.5">
                    i
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#5d2a8b] uppercase tracking-wider">Location Information</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      The service provider will travel to your selected location. Make sure the address is accurate and accessible.
                    </p>
                  </div>
                </div>

                {locationError && (
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle size={14} /> <span>{locationError}</span>
                  </div>
                )}
              </div>

              {/* Step 5: Choose Split Configuration Method and Checkout Review */}
              <div className="space-y-4 pt-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-[#5d2a8b] text-white rounded-full flex items-center justify-center text-xs">5</span>
                  Choose Payment Option & Review
                </h3>
                
                {pricingLoading ? (
                  <div className="text-center py-4 animate-pulse text-xs text-gray-500">Calculating breakdown price models...</div>
                ) : pricingBreakdown ? (
                  <div className="space-y-3">
                    {/* Itemized Pricing Summary */}
                    <div className="bg-gray-50/50 border border-gray-100 p-3.5 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-1">Itemized Pricing Summary</p>
                      {pricingBreakdown.individualBreakdowns?.map((bd: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-gray-600">{bd.personName || guests[idx]?.name || `Person ${idx + 1}`} ({formatCurrency(bd.basePrice)})</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(bd.individualTotal)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t font-bold text-[#5d2a8b]">
                        <span>Grand Total Summary</span>
                        <span>{formatCurrency(pricingBreakdown.grandTotal)}</span>
                      </div>
                    </div>

                    {/* Split Choices */}
                    <div className="space-y-2">
                      <label className={`flex items-center p-3.5 border rounded-lg cursor-pointer transition-all ${paymentType === 'full' ? 'border-[#5d2a8b] bg-purple-50/50' : 'border-gray-200'}`}>
                        <input type="radio" name="paymentSplit" checked={paymentType === 'full'} onChange={() => setPaymentType("full")} className="text-[#5d2a8b]" />
                        <div className="ml-3">
                          <p className="font-bold text-gray-900 text-xs">Pay Full Settlement</p>
                          <p className="text-[11px] text-gray-500">Pay total amount completely now ({formatCurrency(pricingBreakdown.grandTotal)})</p>
                        </div>
                      </label>

                      {pricingBreakdown.paymentOptions?.upfront?.available && (
                        <label className={`flex items-center p-3.5 border rounded-lg cursor-pointer transition-all ${paymentType === 'upfront' ? 'border-[#5d2a8b] bg-purple-50/50' : 'border-gray-200'}`}>
                          <input type="radio" name="paymentSplit" checked={paymentType === 'upfront'} onChange={() => setPaymentType("upfront")} className="text-[#5d2a8b]" />
                          <div className="ml-3">
                            <p className="font-bold text-gray-900 text-xs">Pay Upfront Deposit Portion</p>
                            <p className="text-[11px] text-gray-500">Secure booking now for {formatCurrency(pricingBreakdown.paymentOptions.upfront.amount)} ({pricingBreakdown.upfrontPercentage}% deposit)</p>
                            <p className="text-[10px] text-orange-600 mt-0.5">Remaining Balance: {formatCurrency(pricingBreakdown.paymentOptions.upfront.remainingBalance)}</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Terms and Conditions Card Box Container */}
                <div className="p-4 bg-white border border-purple-200 rounded-xl flex gap-3 items-start shadow-sm mt-4">
                  <span className="text-sm mt-0.5 flex-shrink-0">📄</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#5d2a8b] uppercase tracking-wider">Terms & Conditions</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      By confirming this booking, you agree to our terms of service and cancellation policy. The service provider will contact you to confirm the appointment details.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex gap-3 items-start">
                  <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 text-xs">Secure Payment Escrow Processing</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Transactions are coordinated securely over Flutterwave infrastructure. Slots hold once verified.</p>
                  </div>
                </div>

                <button onClick={handleConfirm} disabled={isSubmitting || !selectedDate || !selectedSlot || !guests[0].name}
                  className="w-full py-3.5 rounded-lg font-bold text-white bg-[#5d2a8b] hover:bg-[#7a3aa3] text-sm transition-colors shadow-md flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Confirming Checkout Pipeline Links...</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>
                        Confirm Booking & Pay{" "}
                        {pricingBreakdown 
                          ? formatCurrency(paymentType === "full" ? pricingBreakdown.grandTotal : pricingBreakdown.paymentOptions?.upfront?.amount) 
                          : formatCurrency(service.price * guests.length)
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;