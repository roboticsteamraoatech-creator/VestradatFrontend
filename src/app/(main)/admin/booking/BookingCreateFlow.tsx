"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Plus, Search, CheckCircle, Loader2, AlertCircle, Calendar } from "lucide-react";
import BookingAdminService, { 
  AvailableSlot, OrganizationUser, ServiceProvider, 
  LocationOption, CreateAdminBookingRequest 
} from "@/services/BookingAdminService";
import { GalleryService } from "@/services/GalleryService";

interface GalleryServiceItem {
  _id: string;
  name: string;
  description: string;
  itemType: 'product' | 'service';
  priceInDollars: number;
  actualAmount: number;
  categoryName?: string;
  industryName?: string;
  imageUrl?: string;
}

type BookingStep = 'service-date' | 'customer' | 'details' | 'location' | 'review';

interface BookingCreateFlowProps {
  token: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const BookingCreateFlow: React.FC<BookingCreateFlowProps> = ({ token, onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service-date');
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  
  // Step 1: Service & Date Selection
  const [galleryServices, setGalleryServices] = useState<GalleryServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');
  const [selectedServicePrice, setSelectedServicePrice] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Step 2: Customer Selection
  const [customerType, setCustomerType] = useState<'existing' | 'external'>('existing');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<OrganizationUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [externalCustomerName, setExternalCustomerName] = useState('');
  const [externalCustomerEmail, setExternalCustomerEmail] = useState('');
  const [externalCustomerPhone, setExternalCustomerPhone] = useState('');

  // Step 3: Details (Service Provider & Guests)
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [guests, setGuests] = useState<Array<{ name: string; email: string; slotDateTime: string; notes?: string }>>([]);
  const [customerNotes, setCustomerNotes] = useState('');

  // Step 4: Location Selection
  const [locationOptions, setLocationOptions] = useState<{
    merchantLocation: LocationOption;
    customerAddress: LocationOption;
    newAddress: LocationOption;
    whatsappLocation: LocationOption;
  } | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<string>('');
  const [locationAddress, setLocationAddress] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Step 5: Review & Payment
  const [processPayment, setProcessPayment] = useState(true);
  const [paymentType, setPaymentType] = useState<'upfront' | 'full'>('upfront');
  const [upfrontPercentage, setUpfrontPercentage] = useState(50);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₦0.00';
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getLocationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      merchant_location: 'Provider Location',
      customer_address: 'Customer Address',
      new_address: 'Custom Address',
      whatsapp_location: 'WhatsApp Location'
    };
    return labels[type] || type;
  };

  // Load gallery services
  useEffect(() => {
    if (currentStep === 'service-date') {
      fetchGalleryServices();
    }
  }, [currentStep]);

  // Load available days
  useEffect(() => {
    if (currentStep === 'service-date') {
      fetchAvailableDays();
    }
  }, [selectedMonth, selectedYear, selectedServiceId, currentStep]);

  // Load available slots
  useEffect(() => {
    if (selectedDate && currentStep === 'service-date') {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedServiceId, currentStep]);

  // Load organization users
  useEffect(() => {
    if (customerType === 'existing' && currentStep === 'customer') {
      const timeoutId = setTimeout(() => fetchOrganizationUsers(), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [customerSearch, customerType, currentStep]);

  // Load service providers
  useEffect(() => {
    if (currentStep === 'details') {
      fetchServiceProviders();
    }
  }, [selectedServiceId, currentStep]);

  // Load location options
  useEffect(() => {
    if (currentStep === 'location') {
      fetchLocationOptions();
    }
  }, [selectedServiceId, currentStep]);

  const fetchGalleryServices = async () => {
    try {
      setLoadingServices(true);
      const response = await GalleryService.getGalleryItems(
        token || '', 1, 100, undefined, undefined, undefined, undefined,
        undefined, undefined, 'createdAt', 'desc', undefined, undefined,
        undefined, undefined, 'service'
      );

      if (response.success && response.data) {
        const services: GalleryServiceItem[] = response.data.items.map((item: any) => ({
          _id: item._id, name: item.name, description: item.description,
          itemType: item.itemType, priceInDollars: item.priceInDollars,
          actualAmount: item.actualAmount || item.priceInDollars,
          categoryName: item.categoryName, industryName: item.industryName,
          imageUrl: item.imageUrl
        }));
        setGalleryServices(services);
      }
    } catch (err: any) {
      console.error('Error fetching gallery services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchAvailableDays = async () => {
    try {
      setLoadingDays(true);
      const response = await BookingAdminService.getAvailableDays(
        selectedMonth, selectedYear, selectedServiceId || undefined
      );
      if (response.success) setAvailableDays(response.data.availableDays);
    } catch (err: any) {
      console.error('Error fetching available days:', err);
    } finally {
      setLoadingDays(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await BookingAdminService.getAvailableSlots(
        selectedDate, selectedServiceId || undefined
      );
      if (response.success) setAvailableSlots(response.data.slots);
    } catch (err: any) {
      console.error('Error fetching available slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchOrganizationUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await BookingAdminService.getOrganizationUsers(
        customerSearch || undefined, 1, 20
      );
      if (response.success) setOrganizationUsers(response.data.users);
    } catch (err: any) {
      console.error('Error fetching organization users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchServiceProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await BookingAdminService.getServiceProviders(
        selectedServiceId || undefined
      );
      if (response.success) setServiceProviders(response.data.providers);
    } catch (err: any) {
      console.error('Error fetching service providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchLocationOptions = async () => {
    try {
      setLoadingLocation(true);
      const response = await BookingAdminService.getLocationOptions(
        selectedServiceId || undefined
      );
      if (response.success) {
        setLocationOptions(response.data.locationOptions);
        setSelectedLocationType(response.data.defaultOption);
      }
    } catch (err: any) {
      console.error('Error fetching location options:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCreateBooking = async () => {
    try {
      setCreatingBooking(true);
      setStepError(null);

      if (!selectedServiceId || !selectedSlot) {
        setStepError('Please select service and time slot');
        return;
      }

      if (customerType === 'existing' && !selectedCustomer) {
        setStepError('Please select a customer');
        return;
      }

      if (customerType === 'external' && (!externalCustomerName || !externalCustomerEmail)) {
        setStepError('Please provide customer name and email');
        return;
      }

      if (customerType === 'existing' && !selectedCustomer?._id && !selectedCustomer?.id && !selectedCustomer?.customUserId) {
        setStepError('Selected customer is missing ID. Please select the customer again.');
        return;
      }

      const location = {
        type: selectedLocationType as any,
        address: locationAddress || undefined,
        whatsappLocationUrl: whatsappUrl || undefined
      };

      const bookingData: CreateAdminBookingRequest = {
        serviceId: selectedServiceId,
        serviceName: selectedServiceName,
        servicePrice: selectedServicePrice,
        customerType,
        customerId: customerType === 'existing' ? (selectedCustomer?._id || selectedCustomer?.id || selectedCustomer?.customUserId) : undefined,
        customerName: customerType === 'external' ? externalCustomerName : selectedCustomer?.name,
        customerEmail: customerType === 'external' ? externalCustomerEmail : selectedCustomer?.email,
        customerPhone: customerType === 'external' ? externalCustomerPhone : selectedCustomer?.phoneNumber,
        primarySlot: selectedSlot,
        guests: guests.length > 0 ? guests : undefined,
        location,
        customerNotes: customerNotes || undefined,
        serviceProviderId: selectedProvider?.id,
        processPayment,
        paymentType: processPayment ? paymentType : undefined,
        upfrontPercentage: processPayment && paymentType === 'upfront' ? upfrontPercentage : undefined
      };

      const response = await BookingAdminService.createAdminBooking(bookingData);

      if (response.success) {
        setCreatedBooking(response.data.booking);
        onSuccess();
      } else {
        setStepError(response.message || 'Failed to create booking');
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setStepError(err.message || 'Failed to create booking');
    } finally {
      setCreatingBooking(false);
    }
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 'service-date':
        return !!(selectedServiceId && selectedDate && selectedSlot);
      case 'customer':
        if (customerType === 'existing') return !!selectedCustomer;
        return !!(externalCustomerName && externalCustomerEmail);
      case 'details':
        return true;
      case 'location':
        if (selectedLocationType === 'new_address') return !!locationAddress;
        if (selectedLocationType === 'whatsapp_location') return !!whatsappUrl;
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps: BookingStep[] = ['service-date', 'customer', 'details', 'location', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    const steps: BookingStep[] = ['service-date', 'customer', 'details', 'location', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={onCancel} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Booking</h1>
          <p className="text-gray-600">Step-by-step booking creation</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            {['service-date', 'customer', 'details', 'location', 'review'].map((step, index) => {
              const steps = ['service-date', 'customer', 'details', 'location', 'review'];
              const currentIndex = steps.indexOf(currentStep);
              const stepIndex = steps.indexOf(step);
              const isActive = step === currentStep;
              const isCompleted = stepIndex < currentIndex;

              return (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-purple-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                  </div>
                  {stepIndex < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Date & Time</span>
            <span>Customer</span>
            <span>Details</span>
            <span>Location</span>
            <span>Review</span>
          </div>
        </div>

        {/* Running Summary (shown on steps 2-5) */}
        {currentStep !== 'service-date' && (selectedServiceName || selectedDate) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm">
            <h3 className="font-medium text-blue-800 mb-2">Booking Summary So Far</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedServiceName && (
                <div>
                  <span className="text-blue-600 block text-xs">Service</span>
                  <span className="font-medium text-gray-800">{selectedServiceName}</span>
                  {selectedServicePrice > 0 && (
                    <span className="text-xs text-gray-600 block">{formatCurrency(selectedServicePrice)}</span>
                  )}
                </div>
              )}
              {selectedSlot && (
                <div>
                  <span className="text-blue-600 block text-xs">Date &amp; Time</span>
                  <span className="font-medium text-gray-800">{formatDate(selectedSlot)}</span>
                </div>
              )}
              {(currentStep === 'details' || currentStep === 'location' || currentStep === 'review') && (
                <div>
                  <span className="text-blue-600 block text-xs">Customer</span>
                  <span className="font-medium text-gray-800">
                    {customerType === 'existing'
                      ? (selectedCustomer?.name || 'Not selected')
                      : (externalCustomerName || 'Not entered')}
                  </span>
                </div>
              )}
              {(currentStep === 'details' || currentStep === 'location' || currentStep === 'review') && (
                <div>
                  <span className="text-blue-600 block text-xs">Total Persons</span>
                  <span className="font-medium text-gray-800">{1 + guests.length}</span>
                </div>
              )}
              {(currentStep === 'location' || currentStep === 'review') && selectedLocationType && (
                <div>
                  <span className="text-blue-600 block text-xs">Delivery / Location</span>
                  <span className="font-medium text-gray-800">{getLocationLabel(selectedLocationType)}</span>
                  {locationAddress && <span className="text-xs text-gray-600 block">{locationAddress}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Error */}
        {stepError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{stepError}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: Service & Date */}
          {currentStep === 'service-date' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Select Service, Date & Time</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Service (from Gallery)</label>
                {loadingServices ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {galleryServices.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                        No services available in gallery
                      </div>
                    ) : (
                      galleryServices.map(service => (
                        <button
                          key={service._id}
                          onClick={() => {
                            setSelectedServiceId(service._id);
                            setSelectedServiceName(service.name);
                            setSelectedServicePrice(service.actualAmount || service.priceInDollars);
                          }}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            selectedServiceId === service._id
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                              {service.categoryName && (
                                <div className="text-xs text-gray-500 mt-1">Category: {service.categoryName}</div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-purple-600">
                                ₦{(service.actualAmount || service.priceInDollars).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Days {loadingDays && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {availableDays.map(day => {
                    const date = new Date(day);
                    const isSelected = selectedDate === day;
                    return (
                      <button key={day} onClick={() => setSelectedDate(day)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300'
                        }`}>
                        <div className="text-sm font-medium">{date.getDate()}</div>
                        <div className="text-xs text-gray-500">{date.toLocaleString('en', { weekday: 'short' })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots {loadingSlots && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button key={slot.datetime} onClick={() => setSelectedSlot(slot.datetime)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedSlot === slot.datetime ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300'
                        }`}>
                        {slot.displayTime}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customer */}
          {currentStep === 'customer' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Select Customer</h2>
              
              <div className="flex gap-4">
                <button onClick={() => setCustomerType('existing')}
                  className={`flex-1 p-4 rounded-lg border-2 ${customerType === 'existing' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}>
                  <div className="font-medium">Existing Customer</div>
                  <div className="text-sm text-gray-600">Select from organization</div>
                </button>
                <button onClick={() => setCustomerType('external')}
                  className={`flex-1 p-4 rounded-lg border-2 ${customerType === 'external' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}>
                  <div className="font-medium">External Customer</div>
                  <div className="text-sm text-gray-600">Enter new customer details</div>
                </button>
              </div>

              {customerType === 'existing' && (
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  
                  {loadingUsers && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                  )}

                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {organizationUsers.map(user => (
                      <button key={user.customUserId} onClick={() => setSelectedCustomer(user)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          selectedCustomer?.customUserId === user.customUserId ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                        }`}>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        {user.customUserId && <div className="text-xs text-gray-500">ID: {user.customUserId}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {customerType === 'external' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input type="text" value={externalCustomerName} onChange={(e) => setExternalCustomerName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" value={externalCustomerEmail} onChange={(e) => setExternalCustomerEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input type="tel" value={externalCustomerPhone} onChange={(e) => setExternalCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Provider (Optional) {loadingProviders && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {serviceProviders.map(provider => (
                    <button key={provider.id} onClick={() => setSelectedProvider(provider)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedProvider?.id === provider.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                      }`}>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-600">{provider.email}</div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-yellow-600">★ {provider.rating}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{provider.completedTasks} tasks</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Guests (Optional)</label>
                  <button onClick={() => setGuests([...guests, { name: '', email: '', slotDateTime: selectedSlot }])}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
                    <Plus className="w-4 h-4" /> Add Guest
                  </button>
                </div>
                
                {guests.map((guest, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="text" value={guest.name}
                        onChange={(e) => {
                          const newGuests = [...guests];
                          newGuests[index].name = e.target.value;
                          setGuests(newGuests);
                        }}
                        placeholder="Guest name" className="px-3 py-2 border border-gray-300 rounded-lg" />
                      <input type="email" value={guest.email}
                        onChange={(e) => {
                          const newGuests = [...guests];
                          newGuests[index].email = e.target.value;
                          setGuests(newGuests);
                        }}
                        placeholder="Guest email" className="px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <button onClick={() => setGuests(guests.filter((_, i) => i !== index))}
                      className="text-sm text-red-600 hover:text-red-700">Remove</button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Notes</label>
                <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={3}
                  placeholder="Special instructions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {currentStep === 'location' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Select Location</h2>
              
              {loadingLocation && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              )}

              {locationOptions && (
                <div className="space-y-3">
                  <button onClick={() => setSelectedLocationType('merchant_location')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedLocationType === 'merchant_location' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}>
                    <div className="font-medium">{locationOptions.merchantLocation.label}</div>
                    <div className="text-sm text-gray-600">{locationOptions.merchantLocation.address}</div>
                  </button>

                  <button onClick={() => setSelectedLocationType('customer_address')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedLocationType === 'customer_address' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}>
                    <div className="font-medium">{locationOptions.customerAddress.label}</div>
                    <div className="text-sm text-gray-600">{locationOptions.customerAddress.description}</div>
                  </button>

                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    selectedLocationType === 'new_address' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <button onClick={() => setSelectedLocationType('new_address')} className="w-full text-left">
                      <div className="font-medium">{locationOptions.newAddress.label}</div>
                      <div className="text-sm text-gray-600">{locationOptions.newAddress.description}</div>
                    </button>
                    {selectedLocationType === 'new_address' && (
                      <input type="text" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)}
                        placeholder={locationOptions.newAddress.placeholder}
                        className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg" />
                    )}
                  </div>

                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    selectedLocationType === 'whatsapp_location' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <button onClick={() => setSelectedLocationType('whatsapp_location')} className="w-full text-left">
                      <div className="font-medium">{locationOptions.whatsappLocation.label}</div>
                      <div className="text-sm text-gray-600">{locationOptions.whatsappLocation.description}</div>
                    </button>
                    {selectedLocationType === 'whatsapp_location' && (
                      <input type="url" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)}
                        placeholder={locationOptions.whatsappLocation.placeholder}
                        className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Payment */}
          {currentStep === 'review' && !createdBooking && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Review & Create Booking</h2>
              
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <p className="font-medium">{selectedServiceName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date & Time:</span>
                    <p className="font-medium">{formatDate(selectedSlot)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium">
                      {customerType === 'existing' ? selectedCustomer?.name : externalCustomerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">{getLocationLabel(selectedLocationType)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Persons:</span>
                    <p className="font-medium">{1 + guests.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Service Fee:</span>
                    <p className="font-medium">{formatCurrency(selectedServicePrice)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="processPayment" checked={processPayment}
                    onChange={(e) => setProcessPayment(e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="processPayment" className="text-sm font-medium">Process Payment</label>
                </div>

                {processPayment && (
                  <div className="space-y-3 pl-7">
                    <div className="flex gap-4">
                      <button onClick={() => setPaymentType('upfront')}
                        className={`flex-1 p-3 rounded-lg border-2 ${paymentType === 'upfront' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}>
                        <div className="font-medium">Upfront Payment</div>
                        <div className="text-sm text-gray-600">Partial payment required</div>
                      </button>
                      <button onClick={() => setPaymentType('full')}
                        className={`flex-1 p-3 rounded-lg border-2 ${paymentType === 'full' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}>
                        <div className="font-medium">Full Payment</div>
                        <div className="text-sm text-gray-600">Complete amount</div>
                      </button>
                    </div>

                    {paymentType === 'upfront' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upfront Percentage: {upfrontPercentage}%
                        </label>
                        <input type="range" min="10" max="100" step="10" value={upfrontPercentage}
                          onChange={(e) => setUpfrontPercentage(parseInt(e.target.value))} className="w-full" />
                        <div className="text-sm text-gray-600 mt-1">
                          Amount: {formatCurrency((selectedServicePrice * upfrontPercentage) / 100)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={prevStep} disabled={creatingBooking}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Back
                </button>
                <button onClick={handleCreateBooking} disabled={creatingBooking}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creatingBooking ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Creating...</>
                  ) : 'Create Booking'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'review' && createdBooking && (
            <div className="space-y-6 text-center">
              {processPayment ? (
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-10 h-10 text-blue-600" />
                </div>
              )}
              
              <h2 className="text-2xl font-semibold">
                {processPayment ? 'Booking Created Successfully!' : 'Booking Created Without Payment'}
              </h2>
              
              {processPayment && createdBooking.paymentLink ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✓ Payment link has been sent to the customer</p>
                  <p className="text-green-700 text-sm mt-1">Customer will receive payment instructions via email</p>
                </div>
              ) : !processPayment ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">ℹ Booking created without payment</p>
                  <p className="text-blue-700 text-sm mt-1">Contact customer directly to arrange payment</p>
                </div>
              ) : null}
              
              <div className="p-6 bg-gray-50 rounded-lg text-left space-y-3">
                {createdBooking.bookingId && (
                  <div><span className="text-gray-600">Booking ID:</span>
                    <p className="font-mono font-bold">{createdBooking.bookingId}</p>
                  </div>
                )}
                {createdBooking.orderId && (
                  <div><span className="text-gray-600">Order ID:</span>
                    <p className="font-mono font-bold">{createdBooking.orderId}</p>
                  </div>
                )}
                {createdBooking.taskId && (
                  <div><span className="text-gray-600">Task ID:</span>
                    <p className="font-mono font-bold">{createdBooking.taskId}</p>
                  </div>
                )}
                <div><span className="text-gray-600">Status:</span>
                  <p className="font-medium capitalize">{createdBooking.status}</p>
                </div>
                <div><span className="text-gray-600">Total Persons:</span>
                  <p className="font-medium">{createdBooking.totalPersons || 1}</p>
                </div>
                <div><span className="text-gray-600">Amount:</span>
                  <p className="font-medium">{formatCurrency(createdBooking.fee || selectedServicePrice)}</p>
                </div>
                {createdBooking.assignedProvider && (
                  <div><span className="text-gray-600">Service Provider:</span>
                    <p className="font-medium">{createdBooking.assignedProvider}</p>
                  </div>
                )}
                {createdBooking.location && (
                  <div><span className="text-gray-600">Location Type:</span>
                    <p className="font-medium">{getLocationLabel(createdBooking.location.type)}</p>
                  </div>
                )}
                {processPayment && createdBooking.paymentLink && (
                  <div><span className="text-gray-600">Payment:</span>
                    <p className="font-medium text-green-600">Payment link sent to customer</p>
                    <a href={createdBooking.paymentLink} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      View Payment Link
                    </a>
                  </div>
                )}
                {!processPayment && (
                  <div><span className="text-gray-600">Payment:</span>
                    <p className="font-medium text-blue-600">No payment required - Direct booking</p>
                  </div>
                )}
              </div>

              <button onClick={onCancel} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Back to Bookings
              </button>
            </div>
          )}

          {currentStep !== 'review' && (
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button onClick={prevStep}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              <button onClick={nextStep} disabled={!canProceedToNextStep()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCreateFlow;
