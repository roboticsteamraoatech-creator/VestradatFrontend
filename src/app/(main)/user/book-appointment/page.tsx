"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  Users,
  Plus,
  X,
  MapPin,
  Phone,
  CheckCircle,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingService, {
  ServiceItem,
  TimeSlot,
  LocationOption,
  BookingLocation,
} from "@/services/BookingService";

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

// Step 1 = Date/Time, Step 2 = Guest Details, Step 3 = Location,
// Step 4 = Sub-Services + Pricing, Step 5 = Confirm & Pay
type Step = 1 | 2 | 3 | 4 | 5;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

import { BASE_URL } from '@/config/api';

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
  const parts = full.trim().split(" ");
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || parts[0] || "" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const labels = ["Date & Time","Guest Details","Location","Add-ons","Confirm"];
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"12px 16px", gap:4, overflowX:"auto" }}>
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
            <div style={{
              width:24, height:24, borderRadius:"50%", fontSize:11, fontWeight:600,
              display:"flex", alignItems:"center", justifyContent:"center",
              background: done ? "#5d2a8b" : active ? "#5d2a8b" : "#e0d6f5",
              color: done || active ? "#fff" : "#999",
            }}>
              {done ? <Check size={12}/> : n}
            </div>
            <span style={{ fontSize:11, color: active ? "#5d2a8b" : done ? "#5d2a8b" : "#aaa", fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
            {i < labels.length - 1 && (
              <div style={{ width:16, height:1, background: done ? "#5d2a8b" : "#e0d6f5", marginLeft:4 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

const BookAppointmentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Strip platform unique code suffix (e.g. "ORG123-009-048" → "ORG123")
  const rawOrganizationId = searchParams.get("organizationId") || "";
  const organizationId = rawOrganizationId.replace(/-\d{3}-\d{3}$/, "");
  const serviceId = searchParams.get("serviceId") || "";

  // ── Service & loading ──
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Calendar ──
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Slots ──
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Step ──
  const [step, setStep] = useState<Step>(1);

  // ── Guests ──
  const makeGuest = (id: number): GuestForm => ({
    id, name:"", firstName:"", lastName:"", email:"", phone:"", age:"", notes:"", selectedSubServices:[],
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
  const [locationValidating] = useState(false);
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
    BookingService.getAvailableDays({ organizationId, month: viewMonth, year: viewYear, serviceId: safeId })
      .then((res) => { if (res.success) setAvailableDays(new Set(res.data.availableDays)); })
      .catch(() => setAvailableDays(new Set()));
  }, [organizationId, viewMonth, viewYear, serviceId]);

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
      if (data.success) setPricingBreakdown(data.data);
    } catch (e) { console.error("Pricing error:", e); }
    finally { setPricingLoading(false); }
  }, [service, organizationId]);

  // Recalculate whenever guests or paymentType changes (on step 4)
  useEffect(() => {
    if (step === 4) calculatePricing(guests, paymentType);
  }, [step, paymentType]); // eslint-disable-line react-hooks/exhaustive-deps


  // ─── Calendar helpers ──────────────────────────────────────────────────────
  const firstDayOfMonth = useCallback(() => {
    const d = new Date(viewYear, viewMonth - 1, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [viewMonth, viewYear]);

  const daysInMonth = useCallback(() => new Date(viewYear, viewMonth, 0).getDate(), [viewMonth, viewYear]);

  const isAvailable = (day: number) => {
    const s = `${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return availableDays.has(s);
  };
  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() + 1 && viewYear === today.getFullYear();
  const isSelected = (day: number) => {
    const s = `${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return selectedDate === s;
  };
  const selectDay = (day: number) => {
    if (!isAvailable(day)) return;
    setSelectedDate(`${viewYear}-${String(viewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
  };

  // ─── Guest helpers ─────────────────────────────────────────────────────────
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

  // ─── Location validation ───────────────────────────────────────────────────
  const validateAndProceedToSubServices = () => {
    setLocationError(null);
    // Basic client-side validation for inputs that require user entry
    if (locationType === "new_address" && !newAddress.trim()) {
      setLocationError("Please enter an address.");
      return;
    }
    if (locationType === "whatsapp_location" && !whatsappLink.trim()) {
      setLocationError("Please enter a WhatsApp location URL.");
      return;
    }
    setStep(4);
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

      // Build bookedForPersons — every guest must have a name
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


  // ─── Shared styles ─────────────────────────────────────────────────────────
  const S = {
    card: { background:"#fff", borderRadius:16, overflow:"hidden", border:"0.5px solid #e0d6f5", boxShadow:"0 4px 24px rgba(93,42,139,0.07)" } as React.CSSProperties,
    header: { background:"linear-gradient(135deg,#5d2a8b 0%,#7a3aa3 100%)", padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:10 } as React.CSSProperties,
    section: { padding:"1.25rem 1.5rem", borderBottom:"0.5px solid #e8e0f5" } as React.CSSProperties,
    sectionLast: { padding:"1.25rem 1.5rem" } as React.CSSProperties,
    input: { width:"100%", padding:"9px 12px", border:"0.5px solid #d0c4e8", borderRadius:8, fontSize:14, background:"#fff", color:"#1a1a2e", outline:"none", boxSizing:"border-box" as const },
    label: { display:"block", fontSize:13, color:"#666", marginBottom:5 } as React.CSSProperties,
    btn: (disabled=false) => ({ width:"100%", background: disabled ? "#9b6dc0" : "#5d2a8b", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:15, fontWeight:600, cursor: disabled ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 } as React.CSSProperties),
    row: { display:"flex", justifyContent:"space-between", fontSize:14, padding:"5px 0" } as React.CSSProperties,
  };

  // ─── Loading / error screens ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#f8f5ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <Loader2 size={40} style={{ animation:"spin 1s linear infinite", color:"#5d2a8b", margin:"0 auto 16px" }}/>
        <p style={{ color:"#666" }}>Loading booking details...</p>
      </div>
    </div>
  );

  if (error || !service) return (
    <div style={{ minHeight:"100vh", background:"#f8f5ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <p style={{ color:"#666", marginBottom:16 }}>{error || "No service selected."}</p>
        <button onClick={() => router.back()} style={{ color:"#5d2a8b", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>← Back</button>
      </div>
    </div>
  );

  // ─── Calendar grid ─────────────────────────────────────────────────────────
  const calDays: React.ReactNode[] = [];
  for (let b = 0; b < firstDayOfMonth(); b++) calDays.push(<div key={`b${b}`}/>);
  for (let d = 1; d <= daysInMonth(); d++) {
    const avail = isAvailable(d), sel = isSelected(d), tod = isToday(d);
    calDays.push(
      <div key={d} onClick={() => selectDay(d)} style={{
        aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center",
        borderRadius:"50%", fontSize:13, fontWeight: avail ? 500 : 400,
        cursor: avail ? "pointer" : "default",
        color: sel ? "#fff" : avail ? "#1a1a2e" : "#ccc",
        background: sel ? "#5d2a8b" : "transparent",
        border: tod && !sel ? "1.5px solid #5d2a8b" : "none",
      }}>{d}</div>
    );
  }

  const dateLabelStr = selectedDate ? (() => {
    const [y,m,d] = selectedDate.split("-");
    return `${parseInt(d)} ${MONTHS[parseInt(m)-1].slice(0,3)} ${y}`;
  })() : "";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f8f5ff", fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif" }}>
      <div style={{ paddingTop:24, padding:"24px 32px" }} className="md:ml-[350px]">
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={S.card}>

            {/* ── Header ── */}
            <div style={S.header}>
              <button onClick={() => step > 1 ? setStep((step-1) as Step) : router.back()}
                style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <ArrowLeft size={16}/>
              </button>
              <div style={{ flex:1, textAlign:"center", color:"#fff", fontWeight:600, fontSize:16 }}>
                {step===1 ? "Select Date & Time" : step===2 ? "Guest Details" : step===3 ? "Choose Location" : step===4 ? "Add-ons & Pricing" : "Confirm Booking"}
              </div>
              <div style={{ width:32 }}/>
            </div>

            {/* ── Step bar ── */}
            <StepBar step={step}/>

            {/* ════════════════════════════════════════════════════════════════
                STEP 1 — Date & Time
            ════════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <>
                <div style={S.section}>
                  <div style={{ fontWeight:600, fontSize:16, color:"#1a1a2e" }}>{service.name}</div>
                  <div style={{ fontSize:13, color:"#888", marginTop:4, display:"flex", gap:12, flexWrap:"wrap" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}><Clock size={12}/>{service.duration} min</span>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}><Globe size={12}/>West Africa Time (WAT)</span>
                  </div>
                  <div style={{ marginTop:6, fontSize:13, color:"#5d2a8b", fontWeight:500 }}>{formatCurrency(service.price)}</div>
                </div>

                {/* Calendar */}
                <div style={S.section}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <button onClick={() => { if(viewMonth===1){setViewMonth(12);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }}
                      style={{ background:"none", border:"0.5px solid #e0d6f5", borderRadius:"50%", width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#5d2a8b" }}>
                      <ChevronLeft size={14}/>
                    </button>
                    <span style={{ fontWeight:500, fontSize:15 }}>{MONTHS[viewMonth-1]} {viewYear}</span>
                    <button onClick={() => { if(viewMonth===12){setViewMonth(1);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }}
                      style={{ background:"none", border:"0.5px solid #e0d6f5", borderRadius:"50%", width:30, height:30, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#5d2a8b" }}>
                      <ChevronRight size={14}/>
                    </button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
                    {DAYS.map(d=><div key={d} style={{ textAlign:"center", fontSize:11, color:"#aaa", paddingBottom:4 }}>{d}</div>)}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>{calDays}</div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div style={S.section}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                      <span style={{ fontWeight:500, fontSize:14 }}>{dateLabelStr}</span>
                      <span style={{ fontSize:12, color:"#888" }}>Duration: {service.duration} min</span>
                    </div>
                    {loadingSlots ? (
                      <div style={{ textAlign:"center", padding:"16px 0" }}>
                        <Loader2 size={20} style={{ animation:"spin 1s linear infinite", color:"#5d2a8b" }}/>
                      </div>
                    ) : slots.length === 0 ? (
                      <p style={{ fontSize:13, color:"#888", textAlign:"center" }}>No slots available for this date.</p>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {slots.map(slot => {
                          const isSel = selectedSlot?.time === slot.time;
                          return (
                            <div key={slot.time} style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <button onClick={() => setSelectedSlot(slot)} style={{
                                flex:1, padding:"10px 14px", border: isSel ? "none" : "0.5px solid #d0c4e8",
                                borderRadius:8, background: isSel ? "#5d2a8b" : "#fff",
                                color: isSel ? "#fff" : "#5d2a8b", fontSize:14, fontWeight:500, cursor:"pointer",
                              }}>{slot.displayTime}</button>
                              {isSel && (
                                <button onClick={() => setStep(2)} style={{
                                  background:"#5d2a8b", color:"#fff", border:"none", borderRadius:8,
                                  padding:"10px 16px", fontSize:14, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap",
                                }}>Next →</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ ...S.section, background:"#faf6ff" }}>
                  <div style={{ fontSize:13, color:"#888" }}>
                    Booking for <strong style={{ color:"#5d2a8b" }}>{dateLabelStr} at {selectedSlot?.displayTime}</strong>
                  </div>
                </div>
                {guests.map((guest, idx) => (
                  <div key={guest.id} style={S.section}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div style={{ fontWeight:500, fontSize:14 }}>{idx === 0 ? "Your details" : `Guest ${idx + 1}`}</div>
                      {idx > 0 && (
                        <button onClick={() => removeGuest(guest.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#bbb" }}>
                          <X size={16}/>
                        </button>
                      )}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      <div>
                        <label style={S.label}>Full name *</label>
                        <input style={S.input} type="text" placeholder="Enter full name" value={guest.name} onChange={e => updateGuest(guest.id,"name",e.target.value)}/>
                      </div>
                      <div>
                        <label style={S.label}>Email address{idx===0?" *":""}</label>
                        <input style={S.input} type="email" placeholder="email@example.com" value={guest.email} onChange={e => updateGuest(guest.id,"email",e.target.value)}/>
                      </div>
                      {idx === 0 && (
                        <div>
                          <label style={S.label}>Phone number</label>
                          <input style={S.input} type="tel" placeholder="+234..." value={guest.phone} onChange={e => updateGuest(guest.id,"phone",e.target.value)}/>
                        </div>
                      )}
                      <div>
                        <label style={S.label}>Age</label>
                        <input style={S.input} type="number" placeholder="Age" value={guest.age} onChange={e => updateGuest(guest.id,"age",e.target.value)}/>
                      </div>
                      <div>
                        <label style={S.label}>Special notes</label>
                        <textarea style={{ ...S.input, resize:"vertical" } as React.CSSProperties} rows={2} placeholder="Any special requests..." value={guest.notes} onChange={e => updateGuest(guest.id,"notes",e.target.value)}/>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={S.section}>
                  <button onClick={addGuest} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#5d2a8b", border:"0.5px solid #5d2a8b", borderRadius:8, padding:"8px 14px", background:"#fff", cursor:"pointer", fontWeight:500 }}>
                    <Plus size={14}/> Add another person
                  </button>
                  <p style={{ fontSize:12, color:"#aaa", marginTop:6 }}>Each person will be booked for the same time slot.</p>
                </div>
                <div style={S.sectionLast}>
                  <button style={S.btn(!guests[0].name || !guests[0].email)} disabled={!guests[0].name || !guests[0].email} onClick={() => setStep(3)}>
                    Next: Choose Location
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ ...S.section, background:"#faf6ff" }}>
                  <div style={{ fontSize:13, color:"#888" }}>
                    {guests.length} person{guests.length > 1 ? "s" : ""} &middot; <strong style={{ color:"#5d2a8b" }}>{dateLabelStr} at {selectedSlot?.displayTime}</strong>
                  </div>
                </div>
                <div style={S.section}>
                  <div style={{ fontWeight:500, fontSize:14, marginBottom:12 }}>Where should the service be provided?</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <label onClick={() => setLocationType("merchant_location")} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", border: locationType==="merchant_location" ? "1.5px solid #5d2a8b" : "0.5px solid #e0d6f5", borderRadius:10, cursor:"pointer", background: locationType==="merchant_location" ? "#faf6ff" : "#fff" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", marginTop:2, flexShrink:0, border: locationType==="merchant_location" ? "5px solid #5d2a8b" : "1.5px solid #bbb" }}/>
                      <div>
                        <div style={{ fontSize:14, color:"#1a1a2e" }}>Merchant&apos;s registered location</div>
                        {locationOptions?.merchantLocation?.address && (
                          <div style={{ fontSize:12, color:"#5d2a8b", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                            <MapPin size={11}/>{locationOptions.merchantLocation.address}
                          </div>
                        )}
                      </div>
                    </label>
                    <label onClick={() => setLocationType("customer_address")} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", border: locationType==="customer_address" ? "1.5px solid #5d2a8b" : "0.5px solid #e0d6f5", borderRadius:10, cursor:"pointer", background: locationType==="customer_address" ? "#faf6ff" : "#fff" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", marginTop:2, flexShrink:0, border: locationType==="customer_address" ? "5px solid #5d2a8b" : "1.5px solid #bbb" }}/>
                      <div>
                        <div style={{ fontSize:14, color:"#1a1a2e" }}>My registered address</div>
                        <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Uses your saved address from profile</div>
                      </div>
                    </label>
                    <label onClick={() => setLocationType("new_address")} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", border: locationType==="new_address" ? "1.5px solid #5d2a8b" : "0.5px solid #e0d6f5", borderRadius:10, cursor:"pointer", background: locationType==="new_address" ? "#faf6ff" : "#fff" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", marginTop:2, flexShrink:0, border: locationType==="new_address" ? "5px solid #5d2a8b" : "1.5px solid #bbb" }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, color:"#1a1a2e" }}>New address</div>
                        {locationType==="new_address" && (
                          <input style={{ ...S.input, marginTop:8 }} type="text" placeholder="Enter full address" value={newAddress} onChange={e => setNewAddress(e.target.value)} onClick={e => e.stopPropagation()}/>
                        )}
                      </div>
                    </label>
                    <label onClick={() => setLocationType("whatsapp_location")} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", border: locationType==="whatsapp_location" ? "1.5px solid #5d2a8b" : "0.5px solid #e0d6f5", borderRadius:10, cursor:"pointer", background: locationType==="whatsapp_location" ? "#faf6ff" : "#fff" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", marginTop:2, flexShrink:0, border: locationType==="whatsapp_location" ? "5px solid #5d2a8b" : "1.5px solid #bbb" }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, color:"#1a1a2e" }}>WhatsApp location link</div>
                        {locationType==="whatsapp_location" && (
                          <input style={{ ...S.input, marginTop:8 }} type="url" placeholder="Paste WhatsApp location URL" value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} onClick={e => e.stopPropagation()}/>
                        )}
                      </div>
                    </label>
                  </div>
                  {locationError && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, padding:"8px 12px", background:"#fff0f0", borderRadius:8, border:"1px solid #fcc" }}>
                      <AlertCircle size={14} style={{ color:"#c00", flexShrink:0 }}/>
                      <span style={{ fontSize:13, color:"#c00" }}>{locationError}</span>
                    </div>
                  )}
                </div>
                <div style={S.sectionLast}>
                  <button style={S.btn(false)} onClick={validateAndProceedToSubServices}>
                    Next: Add-ons
                  </button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div style={{ ...S.section, background:"#faf6ff" }}>
                  <div style={{ fontSize:13, color:"#888" }}>
                    {guests.length} person{guests.length > 1 ? "s" : ""} &middot; <strong style={{ color:"#5d2a8b" }}>{dateLabelStr} at {selectedSlot?.displayTime}</strong>
                  </div>
                </div>
                {subServices.length > 0 && (
                  <div style={S.section}>
                    <div style={{ fontWeight:500, fontSize:14, marginBottom:4 }}>Add-on services (optional)</div>
                    <p style={{ fontSize:12, color:"#aaa", marginBottom:12 }}>Select add-ons for each person</p>
                    {guests.map((guest, idx) => (
                      <div key={guest.id} style={{ marginBottom:16 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#5d2a8b", marginBottom:8 }}>
                          {guest.name || (idx === 0 ? "You" : `Guest ${idx + 1}`)}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {subServices.map(sub => {
                            const checked = guest.selectedSubServices.some(s => s.subServiceId === sub.subServiceId);
                            return (
                              <label key={sub.subServiceId}
                                onClick={() => {
                                  toggleSubService(guest.id, sub);
                                  const next = guests.map(g => g.id===guest.id
                                    ? { ...g, selectedSubServices: checked
                                        ? g.selectedSubServices.filter(s => s.subServiceId !== sub.subServiceId)
                                        : [...g.selectedSubServices, sub] }
                                    : g);
                                  calculatePricing(next, paymentType);
                                }}
                                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, cursor:"pointer", background: checked ? "#f0e6ff" : "#fff", border: checked ? "1px solid #5d2a8b" : "1px solid #e0d6f5" }}>
                                <div style={{ width:18, height:18, borderRadius:4, border:"2px solid #5d2a8b", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background: checked ? "#5d2a8b" : "transparent" }}>
                                  {checked && <Check size={11} style={{ color:"#fff" }}/>}
                                </div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:13, fontWeight:500 }}>{sub.name}</div>
                                  {sub.description && <div style={{ fontSize:11, color:"#888" }}>{sub.description}</div>}
                                </div>
                                <div style={{ fontSize:13, color:"#5d2a8b", fontWeight:600, flexShrink:0 }}>{formatCurrency(sub.price)}</div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={S.section}>
                  <div style={{ fontWeight:500, fontSize:14, marginBottom:12 }}>Pricing breakdown</div>
                  {pricingLoading ? (
                    <div style={{ textAlign:"center", padding:"12px 0" }}>
                      <Loader2 size={18} style={{ animation:"spin 1s linear infinite", color:"#5d2a8b" }}/>
                    </div>
                  ) : pricingBreakdown ? (
                    <>
                      {pricingBreakdown.individualBreakdowns?.map((bd: any, i: number) => (
                        <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:"0.5px solid #f0e6ff" }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"#5d2a8b", marginBottom:4 }}>{bd.personName || guests[i]?.name || `Person ${i+1}`}</div>
                          <div style={S.row}><span style={{ color:"#888" }}>Base service</span><span>{formatCurrency(bd.basePrice)}</span></div>
                          {bd.subServices?.map((s: any, j: number) => (
                            <div key={j} style={S.row}><span style={{ color:"#888" }}>+ {s.name}</span><span style={{ color:"#5d2a8b" }}>{formatCurrency(s.price)}</span></div>
                          ))}
                          <div style={{ ...S.row, fontWeight:600 }}><span>Subtotal</span><span>{formatCurrency(bd.individualTotal)}</span></div>
                        </div>
                      ))}
                      <div style={{ ...S.row, fontSize:15, fontWeight:700, paddingTop:6, borderTop:"0.5px solid #e0d6f5" }}>
                        <span>Grand total</span><span style={{ color:"#5d2a8b" }}>{formatCurrency(pricingBreakdown.grandTotal)}</span>
                      </div>
                      {pricingBreakdown.paymentOptions?.upfront?.available && (
                        <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:8 }}>
                          <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Payment option</div>
                          <label onClick={() => setPaymentType("full")} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, cursor:"pointer", border: paymentType==="full" ? "1.5px solid #5d2a8b" : "0.5px solid #e0d6f5", background: paymentType==="full" ? "#faf6ff" : "#fff" }}>
                            <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, border: paymentType==="full" ? "5px solid #5d2a8b" : "1.5px solid #bbb" }}/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:500 }}>Pay full amount</div>
                              <div style={{ fontSize:12, color:"#5d2a8b", fontWeight:600 }}>{formatCurrency(pricingBreakdown.paymentOptions.full.amount)}</div>
                            </div>
                          </label>
                          <label onClick={() => setPaymentType("upfront")} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, cursor:"pointer", border: paymentType==="upfront" ? "1.5px solid #5d2a8b" : "0.5px solid #e0d6f5", background: paymentType==="upfront" ? "#faf6ff" : "#fff" }}>
                            <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, border: paymentType==="upfront" ? "5px solid #5d2a8b" : "1.5px solid #bbb" }}/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:500 }}>Pay {pricingBreakdown.upfrontPercentage}% upfront</div>
                              <div style={{ fontSize:12, color:"#5d2a8b", fontWeight:600 }}>{formatCurrency(pricingBreakdown.paymentOptions.upfront.amount)}</div>
                              <div style={{ fontSize:11, color:"#888" }}>Balance: {formatCurrency(pricingBreakdown.paymentOptions.upfront.remainingBalance)}</div>
                            </div>
                          </label>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={S.row}>
                      <span style={{ color:"#888" }}>Service cost</span>
                      <span style={{ fontWeight:500 }}>{formatCurrency(service.price * guests.length)}</span>
                    </div>
                  )}
                </div>
                <div style={S.section}>
                  <label style={S.label}>Additional notes (optional)</label>
                  <textarea style={{ ...S.input, resize:"vertical" } as React.CSSProperties} rows={3} placeholder="Any special requests..." value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}/>
                </div>
                <div style={S.sectionLast}>
                  <button style={S.btn(false)} onClick={() => setStep(5)}>Review and Confirm</button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div style={S.section}>
                  <div style={{ fontWeight:500, fontSize:14, marginBottom:14 }}>Booking summary</div>
                  {([
                    ["Service", service.name],
                    ["Date & time", `${dateLabelStr}, ${selectedSlot?.displayTime}`],
                    ["Duration", `${service.duration} min`],
                    ["Guests", `${guests.length} person${guests.length > 1 ? "s" : ""}`],
                    ["Location", locationType==="merchant_location" ? "Merchant address"
                      : locationType==="customer_address" ? "My registered address"
                      : locationType==="new_address" ? (newAddress || "New address")
                      : "WhatsApp location"],
                  ] as [string,string][]).map(([k,v]) => (
                    <div key={k} style={S.row}>
                      <span style={{ color:"#888" }}>{k}</span>
                      <span style={{ color:"#1a1a2e", fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ ...S.section, background:"#faf6ff" }}>
                  <div style={{ fontWeight:500, fontSize:14, marginBottom:12 }}>Guests</div>
                  {guests.map((g, i) => (
                    <div key={g.id} style={{ marginBottom:8, padding:"8px 12px", background:"#fff", borderRadius:8, border:"0.5px solid #e0d6f5" }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{g.name || `Guest ${i+1}`}</div>
                      {g.email && <div style={{ fontSize:12, color:"#888" }}>{g.email}</div>}
                      {g.selectedSubServices.length > 0 && (
                        <div style={{ fontSize:12, color:"#5d2a8b", marginTop:4 }}>
                          Add-ons: {g.selectedSubServices.map(s => s.name).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ ...S.section, background:"#faf6ff" }}>
                  <div style={{ fontWeight:500, fontSize:14, marginBottom:12 }}>Payment</div>
                  {pricingBreakdown ? (
                    <>
                      <div style={S.row}><span style={{ color:"#888" }}>Grand total</span><span style={{ fontWeight:600 }}>{formatCurrency(pricingBreakdown.grandTotal)}</span></div>
                      <div style={{ ...S.row, fontSize:15, fontWeight:700, paddingTop:8, borderTop:"0.5px solid #e0d6f5", marginTop:4 }}>
                        <span>Pay now ({paymentType === "full" ? "full" : `${pricingBreakdown.upfrontPercentage}% upfront`})</span>
                        <span style={{ color:"#5d2a8b" }}>
                          {formatCurrency(paymentType === "full" ? pricingBreakdown.grandTotal : pricingBreakdown.upfrontAmount)}
                        </span>
                      </div>
                      {paymentType === "upfront" && (
                        <div style={{ fontSize:12, color:"#888", marginTop:4 }}>
                          Remaining balance: {formatCurrency(pricingBreakdown.remainingBalance)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={S.row}>
                      <span style={{ color:"#888" }}>Service cost</span>
                      <span style={{ fontWeight:600 }}>{formatCurrency(service.price * guests.length)}</span>
                    </div>
                  )}
                </div>

                <div style={S.section}>
                  <div style={{ fontWeight:500, fontSize:13, marginBottom:8 }}>Service provider</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#888" }}>
                    <Phone size={12} style={{ color:"#5d2a8b" }}/>
                    <span>{locationOptions?.merchantLocation?.address || "Contact provider for details"}</span>
                  </div>
                </div>

                <div style={S.sectionLast}>
                  <button onClick={handleConfirm} disabled={isSubmitting} style={S.btn(isSubmitting)}>
                    {isSubmitting
                      ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/> Processing...</>
                      : `Confirm and Pay ${pricingBreakdown ? formatCurrency(paymentType==="full" ? pricingBreakdown.grandTotal : pricingBreakdown.upfrontAmount) : ""}`
                    }
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: #5d2a8b !important; box-shadow: 0 0 0 2px rgba(93,42,139,0.12); }
      `}</style>
    </div>
  );
};

export default BookAppointmentPage;
