'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  X,
  Search,
  Star,
  Loader2,
  Plus,
  Minus,
  AlertCircle,
  Check,
} from 'lucide-react';
import BookingAdminService from '@/services/BookingAdminService';
import { GalleryService } from '@/services/gallery-sub-service';

// ============ INTERFACES ============

interface ServiceItem {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  producer?: string;
  actualAmount?: number;
  priceInDollars?: number;
  slotDurationMinutes?: number;
  bookingConfig?: { slotDurationMinutes?: number; upfrontPercentage?: number };
  bookingAvailability?: { upfrontPercentage?: number };
  subServiceCount?: number;
  imageUrl?: string;
  itemType?: string;
}

interface SlotItem {
  datetime: string;
  displayTime: string;
  time?: string;
}

interface OrgUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  customUserId: string;
  phoneNumber?: string;
}

interface Provider {
  id: string;
  providerId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  specialties?: string[];
  rating?: number;
  completedTasks?: number;
  completedBookings?: number;
}

interface SubServiceItem {
  subServiceId: string;
  name: string;
  description?: string;
  price: number;
}

interface LocationOpt {
  type: string;
  label: string;
  description?: string;
  address?: string;
  organizationName?: string;
  requiresInput?: boolean;
}

// ============ HELPERS ============

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============ PROGRESS BAR ============

const ProgressBar = ({ current }: { current: number }) => (
  <div className="flex gap-1.5 mb-6">
    {[1, 2, 3, 4, 5].map((n) => (
      <div
        key={n}
        className={`h-1.5 flex-1 rounded-full transition-colors ${
          n < current ? 'bg-green-500' : n === current ? 'bg-purple-600' : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
);

// ============ SERVICE INFO CARD ============

const ServiceInfoCard = ({ service }: { service: ServiceItem }) => {
  const duration =
    service.bookingConfig?.slotDurationMinutes ||
    service.slotDurationMinutes ||
    60;
  const price = service.actualAmount || service.priceInDollars || 0;
  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        {service.imageUrl && (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{service.name}</h3>
          {service.producer && (
            <p className="text-xs text-purple-700 mt-0.5">{service.producer}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {duration} min
            </span>
            <span className="text-xs font-semibold text-purple-700">{formatCurrency(price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN WIZARD COMPONENT (inner) ============

function BookingWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId') || '';

  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Step 1 — Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Step 2 — Time Slots
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Step 3 — Customer & Provider
  const [customerType, setCustomerType] = useState<'existing' | 'external'>('existing');
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<OrgUser | null>(null);
  const [extName, setExtName] = useState('');
  const [extEmail, setExtEmail] = useState('');
  const [extPhone, setExtPhone] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [providerSearch, setProviderSearch] = useState('');

  // Step 4 — Location
  const [locationOptions, setLocationOptions] = useState<LocationOpt[]>([]);
  const [defaultLocationType, setDefaultLocationType] = useState('');
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [validatingLocation, setValidatingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Step 5 — Confirm & Submit
  const [subServices, setSubServices] = useState<SubServiceItem[]>([]);
  const [selectedSubServices, setSelectedSubServices] = useState<SubServiceItem[]>([]);
  const [showSubServicesModal, setShowSubServicesModal] = useState(false);
  const [processPayment, setProcessPayment] = useState(true);
  const [paymentType, setPaymentType] = useState<'upfront' | 'full'>('full');
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- Fetch service on mount ----
  useEffect(() => {
    if (!serviceId) {
      setServiceError('No service ID provided.');
      setLoadingService(false);
      return;
    }
    setLoadingService(true);
    GalleryService.getAdminGalleryItemDetails(serviceId)
      .then((res) => {
        if (res.success && res.data) {
          const item = res.data.galleryItem || res.data.item || res.data;
          setService(item);
        } else {
          setServiceError(res.message || 'Failed to load service details.');
        }
      })
      .catch((err) => setServiceError(err.message || 'Failed to load service.'))
      .finally(() => setLoadingService(false));
  }, [serviceId]);

  // ---- Step 1: Fetch available days ----
  const fetchAvailableDays = useCallback(async () => {
    if (!service) return;
    setLoadingDays(true);
    try {
      const res = await BookingAdminService.getAvailableDays(currentMonth, currentYear, service._id);
      if (res.success && res.data) {
        setAvailableDays(res.data.availableDays || []);
      } else {
        setAvailableDays([]);
      }
    } catch {
      setAvailableDays([]);
    } finally {
      setLoadingDays(false);
    }
  }, [service, currentMonth, currentYear]);

  useEffect(() => {
    if (step === 1 && service) {
      fetchAvailableDays();
    }
  }, [step, service, fetchAvailableDays]);

  // ---- Step 2: Fetch available slots ----
  useEffect(() => {
    if (step !== 2 || !service || !selectedDate) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);
    BookingAdminService.getAvailableSlots(selectedDate, service._id)
      .then((res) => {
        if (res.success && res.data) {
          setAvailableSlots(res.data.slots || []);
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [step, service, selectedDate]);

  // ---- Step 3: Fetch users + providers ----
  useEffect(() => {
    if (step !== 3) return;
    setLoadingUsers(true);
    BookingAdminService.getOrganizationUsers()
      .then((res) => {
        if (res.success && res.data) {
          setOrgUsers((res.data.users || []) as OrgUser[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));

    setLoadingProviders(true);
    BookingAdminService.getDetailedServiceProviders()
      .then((res: any) => {
        if (res?.data?.serviceProviders) {
          const mapped: Provider[] = res.data.serviceProviders.map((p: any) => ({
            id: p.userId || p._id || '',
            providerId: p.customUserId || '',
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            email: p.email || '',
            phoneNumber: p.phoneNumber,
            specialties: p.serviceProviderInfo?.specialties || [],
            rating: p.serviceProviderInfo?.rating,
            completedTasks: p.serviceProviderInfo?.completedBookings,
          }));
          setProviders(mapped);
        } else {
          setProviders([]);
        }
      })
      .catch(() => setProviders([]))
      .finally(() => setLoadingProviders(false));
  }, [step]);

  // ---- Step 4: Fetch location options ----
  useEffect(() => {
    if (step !== 4 || !service) return;
    setLoadingLocation(true);
    setLocationError(null);
    BookingAdminService.getLocationOptions(service._id)
      .then((res) => {
        if (res.success && res.data) {
          const raw = res.data.locationOptions || {};
          const opts: LocationOpt[] = Object.entries(raw).map(([key, val]: [string, any]) => ({
            type: val.type || key,
            label: val.label || key,
            description: val.description,
            address: val.address,
            organizationName: val.organizationName,
            requiresInput: val.requiresInput,
          }));
          setLocationOptions(opts);
          const def = res.data.defaultOption || (opts[0]?.type ?? '');
          setDefaultLocationType(def);
          setSelectedLocationType(def);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLocation(false));
  }, [step, service]);

  // ---- Step 5: Fetch sub-services ----
  useEffect(() => {
    if (step !== 5 || !service) return;
    BookingAdminService.getSubServices(service._id)
      .then((res: any) => {
        const list = res?.data?.subServices || res?.data || [];
        const mapped: SubServiceItem[] = Array.isArray(list)
          ? list.map((s: any) => ({
              subServiceId: s.subServiceId || s._id || s.id || '',
              name: s.name || '',
              description: s.description,
              price: s.price || 0,
            }))
          : [];
        setSubServices(mapped);
      })
      .catch(() => setSubServices([]));
  }, [step, service]);

  // ---- Step 5: Recalculate pricing ----
  useEffect(() => {
    if (step !== 5 || !service) return;
    const upfrontPct =
      pricingBreakdown?.upfrontPercentage ||
      service.bookingAvailability?.upfrontPercentage ||
      service.bookingConfig?.upfrontPercentage ||
      30;
    setLoadingPricing(true);
    const customerName =
      customerType === 'external'
        ? extName || 'Customer'
        : selectedCustomer?.name || 'Customer';
    BookingAdminService.calculatePricing({
      serviceId: service._id,
      bookedForPersons: [
        {
          name: customerName,
          selectedSubServices: selectedSubServices.map((s) => ({
            subServiceId: s.subServiceId,
            name: s.name,
            price: s.price,
          })),
        },
      ],
      paymentType,
      upfrontPercentage: upfrontPct,
    })
      .then((res: any) => {
        setPricingBreakdown(res?.data || res || null);
      })
      .catch(() => setPricingBreakdown(null))
      .finally(() => setLoadingPricing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedSubServices, paymentType, processPayment]);

  // ============ STEP TITLES ============
  const stepTitles = [
    'Select Date',
    'Select Time',
    'Customer & Provider',
    'Location',
    'Review & Confirm',
  ];

  // ============ NAVIGATION ============
  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // ============ CALENDAR GRID ============
  const buildCalendarGrid = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const startDow = firstDay.getDay(); // 0=Sun

    const cells: {
      date: Date;
      dateString: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isAvailable: boolean;
      isSelectable: boolean;
    }[] = [];

    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, -i);
      cells.push({
        date: d,
        dateString: toDateString(d),
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isAvailable: false,
        isSelectable: false,
      });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth - 1, day);
      const ds = toDateString(d);
      const isPast = d < today;
      const isToday = d.getTime() === today.getTime();
      const isAvailable = availableDays.includes(ds);
      cells.push({
        date: d,
        dateString: ds,
        isCurrentMonth: true,
        isToday,
        isPast,
        isAvailable,
        isSelectable: !isPast && isAvailable,
      });
    }

    // Next month fill to 42
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(currentYear, currentMonth, day);
      cells.push({
        date: d,
        dateString: toDateString(d),
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
        isAvailable: false,
        isSelectable: false,
      });
    }

    return cells;
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // ============ STEP 3 VALIDATION ============
  const step3Valid = () => {
    if (customerType === 'existing') return !!selectedCustomer;
    return extName.trim() !== '' && extEmail.trim() !== '';
  };

  // ============ STEP 4: Validate + continue ============
  const handleStep4Continue = async () => {
    setLocationError(null);
    const needsAddress = ['new_address', 'newAddress'].includes(selectedLocationType);
    const needsWhatsapp = ['whatsapp_location', 'whatsappLocation'].includes(selectedLocationType);
    if (needsAddress && !customAddress.trim()) {
      setLocationError('Please enter a custom address.');
      return;
    }
    if (needsWhatsapp && !whatsappUrl.trim()) {
      setLocationError('Please enter a WhatsApp location URL.');
      return;
    }
    setValidatingLocation(true);
    try {
      const customerEmail =
        customerType === 'external' ? extEmail : selectedCustomer?.email || '';
      const payload: any = { locationType: selectedLocationType, customerEmail };
      if (needsAddress) payload.address = customAddress;
      if (needsWhatsapp) payload.whatsappLocationUrl = whatsappUrl;
      const res = await BookingAdminService.validateLocation(payload);
      if (res.success) {
        setStep(5);
      } else {
        setLocationError(res.message || 'Location validation failed.');
      }
    } catch (err: any) {
      // If validation endpoint errors out, allow proceeding
      setStep(5);
    } finally {
      setValidatingLocation(false);
    }
  };

  // ============ STEP 5: Submit ============
  const handleSubmit = async () => {
    if (!service || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const upfrontPct =
        pricingBreakdown?.upfrontPercentage ||
        service.bookingAvailability?.upfrontPercentage ||
        service.bookingConfig?.upfrontPercentage ||
        30;
      const locOpt = locationOptions.find((o) => o.type === selectedLocationType);
      const needsAddress = ['new_address', 'newAddress'].includes(selectedLocationType);
      const needsWhatsapp = ['whatsapp_location', 'whatsappLocation'].includes(selectedLocationType);

      const payload: any = {
        serviceId: service._id || service.id || serviceId,
        serviceName: service.name,
        servicePrice: service.actualAmount || service.priceInDollars || 0,
        customerType,
        customerId:
          customerType === 'existing'
            ? selectedCustomer?._id || selectedCustomer?.id
            : undefined,
        customerName:
          customerType === 'external' ? extName : selectedCustomer?.name,
        customerEmail:
          customerType === 'external' ? extEmail : selectedCustomer?.email,
        customerPhone: customerType === 'external' ? extPhone : undefined,
        primarySlot: (() => {
          const raw = selectedSlot.datetime || selectedSlot.time;
          if (raw && /^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw;
          // Fallback: combine selectedDate + slot time into ISO string
          if (raw && selectedDate) {
            const timePart = raw.includes('T') ? raw.split('T')[1] : raw;
            return `${selectedDate}T${timePart.replace(/Z$/, '')}:00.000Z`;
          }
          return selectedDate ? `${selectedDate}T00:00:00.000Z` : raw;
        })(),
        primaryCustomerSubServices: selectedSubServices.map((s) => ({
          subServiceId: s.subServiceId,
          name: s.name,
          price: s.price,
        })),
        primaryCustomerTotal:
          pricingBreakdown?.grandTotal ||
          pricingBreakdown?.totalAmount ||
          (service.actualAmount || 0),
        guests: [],
        location: {
          type: selectedLocationType,
          ...(needsAddress && { address: customAddress }),
          ...(needsWhatsapp && { address: whatsappUrl }),
          ...(!needsAddress && !needsWhatsapp && locOpt?.address && { address: locOpt.address }),
        },
        customerNotes,
        ...(selectedProvider?.id && { serviceProviderId: selectedProvider.id }),
        paymentType,
        upfrontPercentage: upfrontPct,
        processPayment,
      };

      const res = await BookingAdminService.createAdminBooking(payload);
      if (res.success) {
        const bookingId =
          res.data?.booking?.bookingId ||
          res.data?.booking?.orderId ||
          res.data?.booking?.taskId ||
          '';
        if (processPayment && res.data?.booking?.paymentLink) {
          window.open(res.data.booking.paymentLink, '_blank');
        }
        router.push(`/admin/booking/create/success?bookingId=${bookingId}`);
      } else {
        setSubmitError((res as any).message || 'Failed to create booking.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============ FILTERED LISTS ============
  const filteredOrgUsers = orgUsers.filter((u) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.customUserId.toLowerCase().includes(q)
    );
  });

  const filteredProviders = providers.filter((p) => {
    if (!providerSearch) return true;
    const q = providerSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  // ============ RENDER LOADING / ERROR ============
  if (loadingService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900">Service Not Found</h2>
        <p className="text-sm text-gray-500 text-center">{serviceError || 'Unable to load service details.'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const calendarCells = step === 1 ? buildCalendarGrid() : [];
  const slotDuration =
    service.bookingConfig?.slotDurationMinutes || service.slotDurationMinutes || 60;
  const upfrontPct =
    pricingBreakdown?.upfrontPercentage ||
    service.bookingAvailability?.upfrontPercentage ||
    service.bookingConfig?.upfrontPercentage ||
    30;
  const basePrice = service.actualAmount || service.priceInDollars || 0;
  const subTotal = selectedSubServices.reduce((acc, s) => acc + s.price, 0);
  const amountToCharge =
    pricingBreakdown?.amountToCharge ||
    pricingBreakdown?.grandTotal ||
    pricingBreakdown?.totalAmount ||
    (processPayment
      ? paymentType === 'upfront'
        ? ((basePrice + subTotal) * upfrontPct) / 100
        : basePrice + subTotal
      : 0);

  const selectedLocationOpt = locationOptions.find((o) => o.type === selectedLocationType);

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{stepTitles[step - 1]}</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4 ml-11">Step {step} of 5</p>
        <ProgressBar current={step} />

        {/* Service card (steps 1–4) */}
        {step < 5 && <ServiceInfoCard service={service} />}

        {/* ======== STEP 1: CALENDAR ======== */}
        {step === 1 && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">
                    {MONTH_NAMES[currentMonth - 1]} {currentYear}
                  </h2>
                  {loadingDays && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                </div>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarCells.map((cell, idx) => {
                  const isSelected = cell.dateString === selectedDate;
                  return (
                    <button
                      key={idx}
                      disabled={!cell.isSelectable}
                      onClick={() => cell.isSelectable && setSelectedDate(cell.dateString)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all
                        ${!cell.isCurrentMonth ? 'opacity-20 cursor-default' : ''}
                        ${cell.isSelectable && !isSelected ? 'hover:bg-purple-50 cursor-pointer' : ''}
                        ${isSelected ? 'bg-purple-600 text-white' : ''}
                        ${cell.isToday && !isSelected ? 'ring-2 ring-purple-300' : ''}
                        ${!cell.isSelectable && cell.isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
                        ${isSelected ? 'text-white' : ''}
                      `}
                    >
                      {cell.date.getDate()}
                      {cell.isCurrentMonth && !isSelected && cell.isAvailable && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500" />
                      )}
                      {cell.isCurrentMonth && !isSelected && !cell.isAvailable && !cell.isPast && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                  Available
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-4 h-4 rounded-lg bg-purple-600 inline-block" />
                  Selected
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  Unavailable
                </div>
              </div>
            </div>

            {/* Selected date confirmation */}
            {selectedDate && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Selected Date</p>
                  <p className="text-sm text-green-700">{formatDate(selectedDate)}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6">
              <button
                disabled={!selectedDate}
                onClick={() => setStep(2)}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Time Selection
              </button>
            </div>
          </div>
        )}

        {/* ======== STEP 2: TIME SLOTS ======== */}
        {step === 2 && (
          <div>
            {/* Date badge */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                <Calendar className="w-4 h-4" />
                {formatDate(selectedDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                {service.name}
                {service.producer && ` • ${service.producer}`}
              </span>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 gap-4">
                <Clock className="w-10 h-10 text-gray-300" />
                <h3 className="font-semibold text-gray-700">No slots available for this date</h3>
                <p className="text-sm text-gray-500">Please choose a different date.</p>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Choose Different Date
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {availableSlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.datetime === slot.datetime;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-purple-50 border-l-4 border-purple-600'
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p
                            className={`font-medium text-sm ${
                              isSelected ? 'text-purple-700' : 'text-gray-900'
                            }`}
                          >
                            {slot.displayTime}
                          </p>
                          <p className="text-xs text-gray-500">{slotDuration} min session</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected slot summary */}
            {selectedSlot && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Slot Selected</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span className="font-medium">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time</span>
                    <span className="font-medium">{selectedSlot.displayTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-medium">{slotDuration} minutes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6">
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Details
              </button>
            </div>
          </div>
        )}

        {/* ======== STEP 3: CUSTOMER & PROVIDER ======== */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Customer section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                Customer
              </h3>

              {/* Toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
                {(['existing', 'external'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCustomerType(type)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      customerType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'existing' ? 'Organization User' : 'External Customer'}
                  </button>
                ))}
              </div>

              {customerType === 'existing' ? (
                <>
                  {loadingUsers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      Loading customers...
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowCustomerModal(true)}
                        className="w-full py-2.5 px-4 border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                      >
                        {selectedCustomer ? `Change Customer` : 'Select Customer'}
                      </button>
                      {selectedCustomer && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedCustomer.name}</p>
                            <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
                            <p className="text-xs text-gray-400">{selectedCustomer.customUserId}</p>
                          </div>
                          <button
                            onClick={() => setSelectedCustomer(null)}
                            className="p-1 rounded hover:bg-purple-100"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={extName}
                      onChange={(e) => setExtName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={extEmail}
                      onChange={(e) => setExtEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={extPhone}
                      onChange={(e) => setExtPhone(e.target.value)}
                      placeholder="Enter phone number (optional)"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Provider section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                Service Provider
                <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Assign a specific provider, or leave blank for auto-assignment.
              </p>
              {loadingProviders ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  Loading service providers...
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowProviderModal(true)}
                    className="w-full py-2.5 px-4 border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                  >
                    {selectedProvider ? 'Change Provider' : 'Select Provider'}
                  </button>
                  {selectedProvider && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedProvider.name}</p>
                        <p className="text-xs text-gray-500">{selectedProvider.email}</p>
                        {selectedProvider.rating !== undefined && (
                          <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {selectedProvider.rating.toFixed(1)}
                            {selectedProvider.completedTasks !== undefined &&
                              ` • ${selectedProvider.completedTasks} completed`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedProvider(null)}
                        className="p-1 rounded hover:bg-purple-100"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Special instructions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any notes or special instructions for this booking..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Footer */}
            <button
              disabled={!step3Valid()}
              onClick={() => setStep(4)}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Location
            </button>
          </div>
        )}

        {/* ======== STEP 4: LOCATION ======== */}
        {step === 4 && (
          <div className="space-y-6">
            {loadingLocation ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Select Location
                </h3>
                {locationOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">No location options available.</p>
                ) : (
                  <div className="space-y-3">
                    {locationOptions.map((opt) => {
                      const isSelected = selectedLocationType === opt.type;
                      const needsAddress = ['new_address', 'newAddress'].includes(opt.type);
                      const needsWhatsapp = ['whatsapp_location', 'whatsappLocation'].includes(opt.type);
                      return (
                        <div key={opt.type}>
                          <button
                            onClick={() => {
                              setSelectedLocationType(opt.type);
                              setLocationError(null);
                            }}
                            className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-full h-full rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                              {opt.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                              )}
                              {opt.address && (
                                <p className="text-xs text-gray-600 mt-1">{opt.address}</p>
                              )}
                            </div>
                          </button>
                          {/* Conditional inputs */}
                          {isSelected && needsAddress && (
                            <div className="mt-2 ml-7">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Address <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={customAddress}
                                onChange={(e) => setCustomAddress(e.target.value)}
                                placeholder="Enter full address"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                              />
                            </div>
                          )}
                          {isSelected && needsWhatsapp && (
                            <div className="mt-2 ml-7">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                WhatsApp Location URL <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="url"
                                value={whatsappUrl}
                                onChange={(e) => setWhatsappUrl(e.target.value)}
                                placeholder="https://wa.me/..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Location summary */}
            {selectedLocationType && selectedLocationOpt && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="text-sm font-semibold text-green-800 mb-1">Location Selected</h4>
                <p className="text-sm text-green-700">{selectedLocationOpt.label}</p>
                {selectedLocationOpt.address && (
                  <p className="text-xs text-green-600 mt-0.5">{selectedLocationOpt.address}</p>
                )}
                {['new_address', 'newAddress'].includes(selectedLocationType) && customAddress && (
                  <p className="text-xs text-green-600 mt-0.5">{customAddress}</p>
                )}
                {['whatsapp_location', 'whatsappLocation'].includes(selectedLocationType) && whatsappUrl && (
                  <p className="text-xs text-green-600 mt-0.5 break-all">{whatsappUrl}</p>
                )}
              </div>
            )}

            {/* Error */}
            {locationError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {locationError}
              </div>
            )}

            {/* Footer */}
            <button
              disabled={!selectedLocationType || validatingLocation}
              onClick={handleStep4Continue}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {validatingLocation && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to Review
            </button>
          </div>
        )}

        {/* ======== STEP 5: CONFIRM & SUBMIT ======== */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Booking Summary</h3>
              </div>

              {/* Service Details */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Service Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{service.name}</span>
                  </div>
                  {service.producer && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Provider</span>
                      <span className="font-medium text-gray-900">{service.producer}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium text-gray-900">{slotDuration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Price</span>
                    <span className="font-medium text-gray-900">{formatCurrency(basePrice)}</span>
                  </div>
                </div>
              </div>

              {/* Sub-Services */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sub-Services</h4>
                  <button
                    onClick={() => setShowSubServicesModal(true)}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700"
                  >
                    {selectedSubServices.length > 0 ? 'Edit' : 'Add'} Sub-Services
                  </button>
                </div>
                {selectedSubServices.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No sub-services selected</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSubServices.map((s) => (
                      <div key={s.subServiceId} className="flex justify-between text-sm">
                        <span className="text-gray-700">{s.name}</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(s.price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-100">
                      <span className="text-gray-700">Sub-total</span>
                      <span>{formatCurrency(subTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Schedule</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
                  </div>
                  {selectedSlot && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium text-gray-900">{selectedSlot.displayTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">
                      {customerType === 'external' ? extName : selectedCustomer?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">
                      {customerType === 'external' ? extEmail : selectedCustomer?.email || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900 capitalize">{customerType}</span>
                  </div>
                </div>
              </div>

              {/* Provider (if selected) */}
              {selectedProvider && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assigned Provider</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-gray-900">{selectedProvider.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium text-gray-900">{selectedProvider.email}</span>
                    </div>
                    {selectedProvider.rating !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rating</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {selectedProvider.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900">
                      {selectedLocationOpt?.label || selectedLocationType}
                    </span>
                  </div>
                  {selectedLocationOpt?.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%]">
                        {selectedLocationOpt.address}
                      </span>
                    </div>
                  )}
                  {['new_address', 'newAddress'].includes(selectedLocationType) && customAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%]">{customAddress}</span>
                    </div>
                  )}
                  {['whatsapp_location', 'whatsappLocation'].includes(selectedLocationType) && whatsappUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">URL</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%] break-all text-xs">{whatsappUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Instructions */}
              {customerNotes && (
                <div className="px-5 py-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{customerNotes}</p>
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Payment Options</h3>

              {/* Process Payment toggle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Process Payment</p>
                  <p className="text-xs text-gray-500 mt-0.5">Collect payment for this booking</p>
                </div>
                <button
                  onClick={() => setProcessPayment((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    processPayment ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      processPayment ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Payment type radios */}
              {processPayment && (
                <div className="space-y-2 mb-4">
                  {[
                    { value: 'upfront' as const, label: `Upfront (${upfrontPct}%)` },
                    { value: 'full' as const, label: 'Full Payment' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPaymentType(opt.value)}
                      className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-all text-left ${
                        paymentType === opt.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          paymentType === opt.value ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}
                      >
                        {paymentType === opt.value && (
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Amount summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {loadingPricing ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Base Price</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {subTotal > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Sub-Services</span>
                        <span>{formatCurrency(subTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-purple-700 pt-2 border-t border-gray-200">
                      <span>Amount to Charge</span>
                      <span>{processPayment ? formatCurrency(amountToCharge) : '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {processPayment ? 'Create Booking & Process Payment' : 'Create Booking'}
            </button>
          </div>
        )}
      </div>

      {/* ======== CUSTOMER MODAL ======== */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[1001] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <button
              onClick={() => { setShowCustomerModal(false); setCustomerSearch(''); }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Select Customer</h2>
          </div>
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredOrgUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <User className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No customers found</p>
              </div>
            ) : (
              filteredOrgUsers.map((user) => (
                <button
                  key={user._id || user.id || user.email}
                  onClick={() => {
                    setSelectedCustomer(user);
                    setShowCustomerModal(false);
                    setCustomerSearch('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.customUserId}</p>
                  </div>
                  {selectedCustomer?.email === user.email && (
                    <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======== PROVIDER MODAL ======== */}
      {showProviderModal && (
        <div className="fixed inset-0 z-[1001] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <button
              onClick={() => { setShowProviderModal(false); setProviderSearch(''); }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Select Service Provider</h2>
          </div>
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                placeholder="Search providers..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredProviders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Star className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No providers found</p>
              </div>
            ) : (
              filteredProviders.map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => {
                    setSelectedProvider(prov);
                    setShowProviderModal(false);
                    setProviderSearch('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-700 font-semibold text-sm">
                      {prov.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{prov.name}</p>
                    <p className="text-xs text-gray-500 truncate">{prov.email}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {prov.rating !== undefined && (
                        <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {prov.rating.toFixed(1)}
                        </span>
                      )}
                      {prov.completedTasks !== undefined && (
                        <span className="text-xs text-gray-400">
                          {prov.completedTasks} completed
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedProvider?.id === prov.id && (
                    <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======== SUB-SERVICES MODAL ======== */}
      {showSubServicesModal && (
        <div className="fixed inset-0 z-[1001] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowSubServicesModal(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Select Sub-Services</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {subServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-sm">No sub-services available for this service</p>
              </div>
            ) : (
              subServices.map((sub) => {
                const isChecked = selectedSubServices.some((s) => s.subServiceId === sub.subServiceId);
                return (
                  <button
                    key={sub.subServiceId}
                    onClick={() => {
                      setSelectedSubServices((prev) =>
                        isChecked
                          ? prev.filter((s) => s.subServiceId !== sub.subServiceId)
                          : [...prev, sub]
                      );
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                        isChecked
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{sub.name}</p>
                      {sub.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-purple-700 flex-shrink-0">
                      {formatCurrency(sub.price)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="px-4 py-4 border-t border-gray-100">
            <button
              onClick={() => setShowSubServicesModal(false)}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
            >
              Apply ({selectedSubServices.length} selected)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PAGE EXPORT (wrapped in Suspense for useSearchParams) ============

export default function BookingCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>}>
      <BookingWizardInner />
    </Suspense>
  );
}
